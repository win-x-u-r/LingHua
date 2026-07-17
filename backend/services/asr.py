"""Automatic Speech Recognition via OpenAI Whisper.

Migrated off Huawei Cloud SIS ASR (no more competition-voucher backing) —
Whisper accepts webm/mp3/wav/m4a directly, so we skip the PCM conversion
step Huawei required.

Anti-hallucination measures for short clips (Whisper's famous weakness —
"subscribe to the channel" phenomenon):
  1. Per-language `prompt` biases decoding toward the app's real domain
     (short Mandarin words, common Arabic greetings) instead of YouTube speak.
  2. `temperature=0` = deterministic decoding, no random generation.
  3. Junk-phrase filter drops known hallucinations if they still slip through.

Called by /asr and /pronounce (via app.py).
"""

import re
import time
import logging
import requests
from config import Config

logger = logging.getLogger(__name__)

_WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions"
_WHISPER_MODEL = "whisper-1"

_LANG_HINT = {"zh": "zh", "ar": "ar", "en": "en"}

# Domain-biasing prompts. Whisper conditions its next-token predictions on
# `prompt`, so seeding it with typical app content pulls output away from
# YouTube-style filler. Max 224 tokens per lang.
_PROMPTS = {
    "zh": (
        "学生在练习普通话发音。常见词语：你好，谢谢，再见，我，好，是，不，"
        "老师，学生，中文，学习，喜欢，吃，喝，看，说，去，来，一，二，三。"
    ),
    "ar": (
        "الطالب يتدرب على نطق كلمة أو عبارة قصيرة بالعربية. أمثلة شائعة: "
        "مرحبا، أهلا، شكرا، من فضلك، نعم، لا، كيف حالك، صباح الخير، مساء الخير."
    ),
    "en": (
        "The student is practicing pronunciation of a short English word or phrase, "
        "such as hello, thank you, how are you, good morning, yes, no."
    ),
}

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


def _looks_hallucinated(text: str) -> bool:
    if not text:
        return False
    return any(p.search(text) for p in _HALLUCINATION_PATTERNS)


def speech_to_text(audio_bytes: bytes, filename: str = "audio.webm", lang: str = "zh") -> str:
    """Transcribe audio to text.

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
        return text

    return _whisper_transcribe(audio_bytes, filename, lang)


def _whisper_transcribe(audio_bytes: bytes, filename: str, lang: str) -> str:
    """OpenAI Whisper transcription. Whisper accepts webm/mp3/wav/m4a directly."""
    if not Config.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    hint = _LANG_HINT.get(lang, lang)
    files = {"file": (filename or "audio.webm", audio_bytes)}
    data = {
        "model": _WHISPER_MODEL,
        "language": hint,
        "response_format": "json",
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

    text = (response.json().get("text") or "").strip()

    if _looks_hallucinated(text):
        logger.warning("Whisper hallucination dropped after %.2fs: %r", elapsed, text)
        return ""

    logger.info("Whisper ok in %.2fs: %r", elapsed, text[:120])
    return text
