"""Text-to-Speech routing.

Migrated off Huawei SIS RTTS (no more competition vouchers).

Routing:
  - Chinese: signals the frontend to use browser SpeechSynthesis (Google zh-CN
    female voice — free, deterministic, native to every modern browser).
  - Arabic: prefers Munsit (UAE-based dialect-aware TTS, our regional partner);
    falls back to ElevenLabs (Hua voice) if Munsit fails or isn't configured.
  - English / other: ElevenLabs (Hua voice).

The AI Tutor speaks its replies via a separate path (text_to_speech_tutor,
served by /tutor/tts) with more expressive ElevenLabs settings. The clip path
below uses deterministic settings so short tokens (Arabic phonetic bridge)
don't hallucinate.
"""

import re
import time
import logging
import requests as http_requests
from config import Config

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Public entry points
# ─────────────────────────────────────────────────────────────

def text_to_speech(text: str, lang: str) -> bytes:
    """TTS for the translator / flashcards / practice / clickable phonemes."""
    logger.info("TTS request: lang=%s, %d chars: %r", lang, len(text), text[:80])

    if lang == "zh":
        logger.info("TTS zh -> signalling browser Web Speech API")
        raise ValueError("BROWSER_TTS_CHINESE")

    if lang == "ar" and Config.MUNSIT_API_KEY:
        logger.info("TTS ar -> trying Munsit")
        t0 = time.perf_counter()
        try:
            from services.munsit_tts import synthesize_arabic
            audio = synthesize_arabic(text)
            logger.info("Munsit TTS ok in %.2fs (%d bytes)", time.perf_counter() - t0, len(audio))
            return audio
        except Exception as e:
            logger.warning("Munsit TTS failed in %.2fs, falling back to ElevenLabs: %s",
                           time.perf_counter() - t0, e)

    logger.info("TTS %s -> ElevenLabs Hua (clip)", lang)
    t0 = time.perf_counter()
    audio = _elevenlabs_tts_clip(text)
    logger.info("ElevenLabs ok in %.2fs (%d bytes)", time.perf_counter() - t0, len(audio))
    return audio


def text_to_speech_tutor(text: str) -> bytes:
    """ElevenLabs TTS for the AI tutor (custom Hua voice, expressive)."""
    logger.info("Tutor TTS: %d chars: %r", len(text), text[:80])
    clean = re.sub(r'\([^)]*\)', '', text)
    clean = re.sub(r'[,،.。!！?？;；:：—–\-]+', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    t0 = time.perf_counter()
    audio = _elevenlabs_tts(clean or text, expressive=True)
    logger.info("Tutor ElevenLabs ok in %.2fs (%d bytes)", time.perf_counter() - t0, len(audio))
    return audio


# ─────────────────────────────────────────────────────────────
# ElevenLabs
# ─────────────────────────────────────────────────────────────

def _elevenlabs_tts_clip(text: str) -> bytes:
    """Deterministic ElevenLabs TTS for short/individual clips (translator,
    Arabic phonetic bridge). High stability keeps single-token output stable."""
    return _elevenlabs_tts(text, expressive=False)


def _elevenlabs_tts(text: str, *, expressive: bool) -> bytes:
    """Core ElevenLabs API call. `expressive=True` = tutor conversational voice;
    `expressive=False` = short-safe deterministic settings."""
    if not Config.ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY is not configured")

    if expressive:
        voice_settings = {
            "stability": 0.4,
            "similarity_boost": 0.8,
            "style": 0.55,
            "use_speaker_boost": True,
        }
        speed = 1.15
    else:
        # Short input needs high stability + no style exaggeration, or the
        # multilingual model can hallucinate a different syllable per call.
        voice_settings = {
            "stability": 0.85,
            "similarity_boost": 0.85,
            "style": 0.0,
            "use_speaker_boost": True,
        }
        speed = 1.0

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{Config.ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": Config.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": Config.ELEVENLABS_MODEL,
        "speed": speed,
        "voice_settings": voice_settings,
    }

    response = http_requests.post(url, json=payload, headers=headers, timeout=30)
    if not response.ok:
        raise RuntimeError(f"ElevenLabs TTS failed: {response.status_code} {response.text}")
    return response.content
