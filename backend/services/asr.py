"""Automatic Speech Recognition via OpenAI Whisper.

Migrated off Huawei Cloud SIS ASR (no more competition-voucher backing) —
Whisper accepts webm/mp3/wav/m4a directly, so we skip the PCM conversion
step Huawei required.

Anti-hallucination measures for short clips (Whisper's famous weakness —
"subscribe to the channel" phenomenon):
  1. A style-only `prompt` (script and punctuation, no vocabulary), because
     Whisper copies its prompt back when the audio is unclear.
  2. `temperature=0` = deterministic decoding, no random generation.
  3. Per-segment confidence (no_speech_prob, avg_logprob, compression_ratio)
     marks a result as unclear instead of passing a guess on for grading.
  4. Junk-phrase and prompt-echo filter for anything that still slips through.

Called by /asr and /pronounce (via app.py).
"""

from __future__ import annotations

import os
import re
import time
import logging
import requests
from config import Config

logger = logging.getLogger(__name__)

_WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions"
_WHISPER_MODEL = "whisper-1"

_LANG_HINT = {"zh": "zh", "ar": "ar", "en": "en"}

# Style-only prompts. Whisper conditions its output on `prompt`, and when the
# audio is unclear it tends to copy the prompt back word for word. The old
# prompts listed sample vocabulary (你好，谢谢，再见 …), so a mumbled or quiet
# 对不起 came back as "好，谢谢，再见" and was graded as if the learner said it.
# These prompts only set the script and punctuation style and contain no
# practice words, and anything that still echoes them is dropped below.
_PROMPTS = {
    "zh": "以下是普通话的句子。",
    "ar": "جملة قصيرة باللغة العربية.",
    "en": "A short sentence in English.",
}

# Confidence thresholds, from Whisper's own decoding defaults.
# no_speech_prob: chance the segment had no speech at all.
# avg_logprob: how sure the model was of the words it wrote (0 = certain).
# compression_ratio: very repetitive output ("谢谢谢谢谢谢…") is a loop, not speech.
# Each can be tuned on the server through .env without a code change.
_NO_SPEECH_PROB = float(os.getenv("ASR_NO_SPEECH_PROB", "0.6"))
_MIN_AVG_LOGPROB = float(os.getenv("ASR_MIN_AVG_LOGPROB", "-1.0"))
_MAX_COMPRESSION_RATIO = float(os.getenv("ASR_MAX_COMPRESSION_RATIO", "2.4"))

# Whisper's greatest hits of hallucinated filler on short/silent clips.
# If the returned text is *just* one of these (or trivially matches), drop it
# rather than lie to the scoring layer.
_HALLUCINATION_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        # Arabic — YouTube "subscribe/like/thanks"
        r"^\s*اشترك.*قنا",           # "subscribe to the channel" variants
        r"^\s*شكر.*مشاهد",           # "thanks for watching"
        r"^\s*ترجم[ةت].*(سيد|نانسي)", # "translation by …" credits
        r"^\s*لا تنس.*(اعجاب|إعجاب)", # "don't forget to like"
        # Chinese — subtitle credit / subscribe filler
        r"^\s*请订阅",                # "please subscribe"
        r"^\s*(多谢|谢谢)观看",       # "thanks for watching"
        r"^\s*字幕由.*(提供|制作)",   # "subtitles by …"
        r"^\s*本[视視]频",            # "this video …" credit lines
        # English — the classic
        r"^\s*(thanks?|thank you) for watching\.?\s*$",
        r"^\s*please (like and )?subscribe.*",
        r"^\s*subscribe to (my |the )?channel.*",
    ]
]


def _looks_hallucinated(text: str, lang: str = "") -> bool:
    if not text:
        return False
    if any(p.search(text) for p in _HALLUCINATION_PATTERNS):
        return True
    # Prompt echo: the answer is a long piece of the prompt we sent. Short
    # matches are allowed so a learner can still practise 是 or 普通话.
    prompt = _PROMPTS.get(lang, "")
    core = re.sub(r"[\s。，,.!！?？]", "", text)
    return len(core) >= 4 and core in re.sub(r"[\s。，,.!！?？]", "", prompt)


class Transcript:
    """What the recogniser heard, plus whether we can trust it.

    `unclear` is None when the text is usable, or a short reason code:
      "no_speech"      - nothing that sounded like speech
      "low_confidence" - speech, but the model was guessing
      "hallucination"  - known filler / prompt echo / repetition loop
    """

    def __init__(self, text: str, unclear: str | None = None):
        self.text = text if unclear is None else ""
        self.unclear = unclear


def speech_to_text(audio_bytes: bytes, filename: str = "audio.webm", lang: str = "zh") -> str:
    """Transcribe audio to text. Returns "" when the audio was unclear."""
    return transcribe(audio_bytes, filename, lang).text


def transcribe(audio_bytes: bytes, filename: str = "audio.webm", lang: str = "zh") -> Transcript:
    """Transcribe audio and say whether the result can be trusted.

    Routing:
      - Arabic -> Munsit (UAE-based, Gulf-dialect-aware). NO fallback — Whisper
        hallucinates too badly on short Arabic clips, so a failure here surfaces
        as an error rather than a lie.
      - Chinese / English / other -> Whisper (with prompt bias + hallucination filter).
    """
    logger.info("ASR request: lang=%s, file=%s, size=%d bytes", lang, filename, len(audio_bytes))

    if lang == "ar":
        if not Config.MUNSIT_API_KEY:
            logger.error("Arabic ASR requested but MUNSIT_API_KEY is not configured")
            raise RuntimeError(
                "MUNSIT_API_KEY is not configured — Arabic ASR requires Munsit "
                "(Whisper is not a safe fallback for short Arabic input)."
            )
        from services.munsit_stt import transcribe_arabic
        logger.info("Munsit STT: calling transcribe_arabic ...")
        t0 = time.perf_counter()
        try:
            text = transcribe_arabic(audio_bytes, filename)
        except Exception as e:
            logger.error("Munsit STT FAILED after %.2fs: %s", time.perf_counter() - t0, e)
            raise
        logger.info("Munsit STT ok in %.2fs: %r", time.perf_counter() - t0, text[:120])
        return Transcript(text, None if text.strip() else "no_speech")

    return _whisper_transcribe(audio_bytes, filename, lang)


def _whisper_transcribe(audio_bytes: bytes, filename: str, lang: str) -> Transcript:
    """OpenAI Whisper transcription. Whisper accepts webm/mp3/wav/m4a directly.

    Uses verbose_json so we get per-segment confidence and can say
    "I didn't catch that" instead of grading a guess.
    """
    if not Config.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    hint = _LANG_HINT.get(lang, lang)
    files = {"file": (_safe_filename(filename), audio_bytes)}
    data = {
        "model": _WHISPER_MODEL,
        "language": hint,
        "response_format": "verbose_json",
        "temperature": 0,
    }
    if hint in _PROMPTS:
        data["prompt"] = _PROMPTS[hint]

    headers = {"Authorization": f"Bearer {Config.OPENAI_API_KEY}"}

    logger.info("Whisper: calling OpenAI (lang=%s) ...", hint)
    t0 = time.perf_counter()
    response = requests.post(_WHISPER_URL, files=files, data=data, headers=headers, timeout=60)
    elapsed = time.perf_counter() - t0
    if not response.ok:
        logger.error("Whisper FAILED in %.2fs: %s %s", elapsed, response.status_code, response.text[:200])
        raise RuntimeError(f"Whisper ASR failed: {response.status_code} {response.text}")

    body = response.json()
    text = (body.get("text") or "").strip()
    unclear = judge_whisper(text, body.get("segments") or [], hint)
    if unclear:
        logger.warning("Whisper result unclear (%s) after %.2fs: %r", unclear, elapsed, text[:120])
    else:
        logger.info("Whisper ok in %.2fs: %r", elapsed, text[:120])
    return Transcript(text, unclear)


def judge_whisper(text: str, segments: list, lang: str) -> str | None:
    """Decide whether a Whisper result is trustworthy. Returns a reason code or None."""
    if not text:
        return "no_speech"
    if _looks_hallucinated(text, lang):
        return "hallucination"
    if not segments:
        return None

    # Weight each segment by its length so one shaky word in a long
    # sentence doesn't sink the whole result.
    total = sum(max(len(s.get("text") or ""), 1) for s in segments)

    def avg(key: str, default: float) -> float:
        return sum(
            float(s.get(key, default)) * max(len(s.get("text") or ""), 1) for s in segments
        ) / total

    no_speech = avg("no_speech_prob", 0.0)
    logprob = avg("avg_logprob", 0.0)
    compression = max(float(s.get("compression_ratio", 0.0)) for s in segments)

    if no_speech > _NO_SPEECH_PROB and logprob < _MIN_AVG_LOGPROB:
        return "no_speech"
    if compression > _MAX_COMPRESSION_RATIO:
        return "hallucination"
    if logprob < _MIN_AVG_LOGPROB:
        return "low_confidence"
    return None


# Whisper picks the decoder from the file extension, so the browser must name
# the file after its real format (iPhones record audio/mp4, not webm).
def _safe_filename(filename: str | None) -> str:
    name = (filename or "audio.webm").strip() or "audio.webm"
    return name if "." in name else f"{name}.webm"
