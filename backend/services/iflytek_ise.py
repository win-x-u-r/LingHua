"""Pronunciation and tone scoring with iFlytek Global Pronunciation Assessment.

iFlytek listens to the recording against the Chinese the learner was asked to
say and scores every syllable: was it said at all, were the sounds right, was
the tone right. Unlike the Whisper route it does not guess a transcript first,
so a wrong tone is caught even when the word is recognisable.

Privacy: the recording is decoded in memory, streamed to iFlytek and dropped.
Nothing is written to disk and no audio is logged.

Needs in the backend environment (all three; without them /pronounce answers
503 "scoring_unavailable", there is no Whisper fallback):
  IFLYTEK_APPID
  IFLYTEK_API_KEY
  IFLYTEK_API_SECRET
Optional:
  IFLYTEK_ISE_URL   default wss://ise-api-sg.xf-yun.com/v2/ise

Protocol: https://global.xfyun.cn/doc/voiceservice/ise/API.html
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import io
import json
import logging
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import format_datetime
from urllib.parse import urlencode, urlparse

from config import Config
from services.scoring import _char_segments, _get_pinyin_display, _pinyin_to_arabic

logger = logging.getLogger("linghua.iflytek")

SAMPLE_RATE = 16000
BYTES_PER_SECOND = SAMPLE_RATE * 2          # 16-bit mono
MIN_SECONDS = 0.3                            # shorter than this is not speech
MAX_SECONDS = 30                             # Practice clips are a few seconds
CHUNK_BYTES = 6400                           # 0.2 s per frame (limit is 19200)
TIMEOUT_SECONDS = 15

# except_info values that mean the clip can't be trusted (from iFlytek's docs).
_NO_SPEECH = {"28673"}                       # silence or far too quiet
_UNUSABLE = {"28676", "28680"}               # random speech / too noisy

_HAN = re.compile(r"[㐀-䶿一-鿿豈-﫿]")
_PUNCT = re.compile(r"[\s　-〿＀-￯!-/:-@\[-`{-~…—·]")


class IflytekError(RuntimeError):
    """iFlytek could not score this clip."""


def enabled() -> bool:
    return bool(Config.IFLYTEK_APPID and Config.IFLYTEK_API_KEY and Config.IFLYTEK_API_SECRET)


def clean_text(expected: str) -> str | None:
    """The Chinese to score, without punctuation. None if it isn't all Chinese."""
    text = _PUNCT.sub("", expected or "")
    if not text or not all(_HAN.match(ch) for ch in text):
        return None
    return text


# --- audio ---------------------------------------------------------------

def to_pcm16k(audio_bytes: bytes) -> bytes:
    """Decode any browser recording (webm/opus, mp4/aac, wav) to 16 kHz mono PCM."""
    import av  # imported here so the rest of the backend starts without it

    out = bytearray()
    try:
        with av.open(io.BytesIO(audio_bytes), mode="r") as container:
            stream = next((s for s in container.streams if s.type == "audio"), None)
            if stream is None:
                raise IflytekError("no audio track")
            resampler = av.AudioResampler(format="s16", layout="mono", rate=SAMPLE_RATE)
            for frame in container.decode(stream):
                for res in resampler.resample(frame):
                    out += bytes(res.planes[0])[: res.samples * 2]
                if len(out) > MAX_SECONDS * BYTES_PER_SECOND:
                    raise IflytekError("recording too long")
            for res in resampler.resample(None):
                out += bytes(res.planes[0])[: res.samples * 2]
    except IflytekError:
        raise
    except Exception as e:  # corrupt or unsupported file
        raise IflytekError(f"could not decode audio: {type(e).__name__}") from e
    return bytes(out)


# --- connection ----------------------------------------------------------

def signed_url(now: datetime | None = None) -> str:
    """The WebSocket address with iFlytek's HMAC-SHA256 signature in the query."""
    url = urlparse(Config.IFLYTEK_ISE_URL)
    host, path = url.netloc, url.path or "/v2/ise"
    date = format_datetime(now or datetime.now(timezone.utc), usegmt=True)
    origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"
    signature = base64.b64encode(
        hmac.new(Config.IFLYTEK_API_SECRET.encode(), origin.encode(), hashlib.sha256).digest()
    ).decode()
    auth = (
        f'api_key="{Config.IFLYTEK_API_KEY}", algorithm="hmac-sha256", '
        f'headers="host date request-line", signature="{signature}"'
    )
    query = urlencode({
        "authorization": base64.b64encode(auth.encode()).decode(),
        "date": date,
        "host": host,
    })
    return f"{url.scheme}://{host}{path}?{query}"


def frames(pcm: bytes, text: str) -> list[dict]:
    """Parameter frame, then the audio in first / middle / last frames."""
    category = "read_syllable" if len(text) == 1 else "read_sentence"
    first = {
        "common": {"app_id": Config.IFLYTEK_APPID},
        "business": {
            "sub": "ise",
            "ent": "cn_vip",
            "category": category,
            "cmd": "ssb",
            "text": "﻿" + text,
            "tte": "utf-8",
            "ttp_skip": True,
            "aue": "raw",
            "auf": "audio/L16;rate=16000",
            "rstcd": "utf8",
        },
        "data": {"status": 0},
    }
    chunks = [pcm[i:i + CHUNK_BYTES] for i in range(0, len(pcm), CHUNK_BYTES)]
    if len(chunks) == 1:  # need distinct first and last frames
        half = max(2, (len(pcm) // 4) * 2)
        chunks = [pcm[:half], pcm[half:]]
    out = [first]
    for i, chunk in enumerate(chunks):
        last = i == len(chunks) - 1
        out.append({
            "business": {"cmd": "auw", "aus": 4 if last else (1 if i == 0 else 2)},
            "data": {"status": 2 if last else 1, "data": base64.b64encode(chunk).decode()},
        })
    return out


def assess(pcm: bytes, text: str) -> str:
    """Send one clip and return iFlytek's result XML."""
    import websocket  # websocket-client

    try:
        ws = websocket.create_connection(signed_url(), timeout=TIMEOUT_SECONDS)
    except Exception as e:
        raise IflytekError(f"could not connect: {e}") from e
    try:
        for frame in frames(pcm, text):
            ws.send(json.dumps(frame))
            time.sleep(0.005)
        deadline = time.monotonic() + TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            msg = json.loads(ws.recv())
            if msg.get("code", 0) != 0:
                logger.warning("iFlytek error %s (%s) sid=%s", msg.get("code"), msg.get("message"), msg.get("sid"))
                raise IflytekError(f"iFlytek error {msg.get('code')}: {msg.get('message')}")
            data = msg.get("data") or {}
            if data.get("status") == 2:
                logger.info("iFlytek scored sid=%s", msg.get("sid"))
                return base64.b64decode(data.get("data") or "").decode("utf-8")
        raise IflytekError("timed out waiting for the score")
    except IflytekError:
        raise
    except Exception as e:
        raise IflytekError(f"connection failed: {type(e).__name__}: {e}") from e
    finally:
        try:
            ws.close()
        except Exception:
            pass


# --- result --------------------------------------------------------------

def _num(el: ET.Element, name: str) -> int:
    try:
        return max(0, min(100, int(round(float(el.get(name, "0"))))))
    except ValueError:
        return 0


def parse(xml_text: str, expected: str) -> dict:
    """Turn iFlytek's XML into the same answer /pronounce gives today."""
    root = ET.fromstring(xml_text)
    paper = root.find(".//rec_paper")
    scored = None
    if paper is not None:
        scored = next((el for el in paper if el.get("total_score") is not None), None)
    if scored is None:
        scored = next((el for el in root.iter() if el.get("total_score") is not None), None)
    if scored is None:
        raise IflytekError("no score in result")

    pinyin = _get_pinyin_display(expected)
    arabic = _pinyin_to_arabic(expected)
    unclear_answer = {"expected_pinyin": pinyin, "expected_arabic": arabic}

    except_info = scored.get("except_info", "0")
    if except_info in _NO_SPEECH:
        return {"unclear": "no_speech", **unclear_answer}
    if except_info in _UNUSABLE or scored.get("is_rejected") == "true":
        return {"unclear": "low_confidence", **unclear_answer}

    # One entry per syllable the learner was meant to say; skip silences and
    # extra syllables they added.
    sylls = [
        s for s in scored.iter("syll")
        if s.get("rec_node_type", "paper") == "paper"
        and s.get("content") not in ("sil", "silv", "fil")
        and s.get("dp_message", "0") != "32"
    ]
    expected_segs = _char_segments(expected)
    if sylls and all(s.get("dp_message") == "16" for s in sylls):
        return {"unclear": "no_speech", **unclear_answer}

    segments = []
    for i, seg in enumerate(expected_segs):
        syll = sylls[i] if i < len(sylls) else None
        out = {k: seg[k] for k in ("char", "pinyin", "tone", "arabic")}
        dp = syll.get("dp_message", "0") if syll is not None else "16"
        if dp == "16":  # not said
            out.update(char_correct=False, pinyin_correct=False, tone_correct=False, heard_pinyin="")
        else:
            errs = [p.get("perr_msg", "0") for p in syll.iter("phone")]
            sound_ok = dp == "0" and not any(e in ("1", "3") for e in errs)
            tone_ok = dp == "0" and not any(e in ("2", "3") for e in errs)
            out.update(char_correct=dp == "0", pinyin_correct=sound_ok, tone_correct=tone_ok)
            if sound_ok and tone_ok:
                out["heard_pinyin"] = seg["pinyin"]
            # When something was off, iFlytek says what kind of mistake but not
            # exactly what it heard, so there is no heard_pinyin to show.
        segments.append(out)

    return {
        "engine": "iflytek",
        "score": _num(scored, "total_score"),
        "recognized": "",
        "expected_pinyin": pinyin,
        "expected_arabic": arabic,
        "recognized_pinyin": "",
        "recognized_arabic": "",
        "segments": segments,
        "breakdown": {
            "character": {"score": _num(scored, "integrity_score"), "weight": 0, "label": "Completeness"},
            "pinyin": {"score": _num(scored, "phone_score"), "weight": 0, "label": "Sounds"},
            "tone": {"score": _num(scored, "tone_score"), "weight": 0, "label": "Tones"},
        },
        "fluency": _num(scored, "fluency_score"),
        "unclear": None,
    }


def score(audio_bytes: bytes, expected: str) -> dict:
    """Score one recording. Raises IflytekError when iFlytek can't be used."""
    text = clean_text(expected)
    if text is None:
        raise IflytekError("expected text is not all Chinese")
    pcm = to_pcm16k(audio_bytes)
    if len(pcm) < MIN_SECONDS * BYTES_PER_SECOND:
        pinyin = _get_pinyin_display(text)
        return {"unclear": "no_speech", "expected_pinyin": pinyin, "expected_arabic": _pinyin_to_arabic(text)}
    return parse(assess(pcm, text), text)
