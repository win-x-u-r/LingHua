"""Arabic Speech-to-Text via Munsit (UAE-based dialect-aware ASR).

Munsit provides far better recognition for spoken Gulf, Egyptian, Levantine,
and Maghrebi Arabic than the browser's Web Speech API or even Huawei SIS
(whose Arabic models are tuned for Modern Standard Arabic).

Used in Dialogue Mode to produce the high-accuracy FINAL transcript that gets
sent to translation — while the live interim transcript shown in the UI is
still produced by the browser for instant feedback.

API: POST https://api.munsit.com/api/v1/audio/transcribe
Auth: x-api-key header
Request: multipart/form-data with "file" (audio) and optional "model"
Response: JSON { transcriptionId, transcription, duration, timestamps[] }
"""

import logging
import time
import requests as http_requests
from config import Config

logger = logging.getLogger(__name__)


def transcribe_arabic(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe Arabic audio via Munsit's batch API.

    Args:
        audio_bytes: Raw audio file bytes from the browser MediaRecorder.
                     Munsit accepts common formats (WAV, MP3, OGG, WebM).
        filename: Filename hint — used to suggest the format to Munsit.

    Returns:
        The recognised Arabic transcript text.

    Raises:
        RuntimeError if the API key is missing.
        requests.HTTPError if the API returns a non-2xx response.
        ValueError if the response doesn't contain a transcription.
    """
    if not Config.MUNSIT_API_KEY:
        raise RuntimeError("MUNSIT_API_KEY is not configured")

    url = f"{Config.MUNSIT_API_BASE}/audio/transcribe"
    files = {
        "file": (filename, audio_bytes, _infer_mime(filename)),
    }
    data = {
        "model": Config.MUNSIT_STT_MODEL,
    }
    headers = {
        "x-api-key": Config.MUNSIT_API_KEY,
    }

    logger.info("Munsit -> POST %s (model=%s, mime=%s, %d bytes)",
                url, Config.MUNSIT_STT_MODEL, _infer_mime(filename), len(audio_bytes))
    t0 = time.perf_counter()
    response = http_requests.post(
        url, files=files, data=data, headers=headers, timeout=60
    )
    elapsed = time.perf_counter() - t0
    if not response.ok:
        logger.error("Munsit <- %d in %.2fs: %s", response.status_code, elapsed, response.text[:300])
    else:
        logger.info("Munsit <- %d in %.2fs", response.status_code, elapsed)
    response.raise_for_status()

    payload = response.json()
    # Munsit nests the result under "data" — fall back to top-level for
    # robustness in case they change the envelope later.
    body = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(body, dict):
        body = payload if isinstance(payload, dict) else {}

    transcript = (body.get("transcription") or "").strip()
    if not transcript:
        raise ValueError(
            f"Munsit returned empty transcription. Response: {payload!r}"
        )

    return transcript


def _infer_mime(filename: str) -> str:
    """Best-effort MIME type from filename extension."""
    name = (filename or "").lower()
    if name.endswith(".webm"):
        return "audio/webm"
    if name.endswith(".mp3"):
        return "audio/mpeg"
    if name.endswith(".wav"):
        return "audio/wav"
    if name.endswith(".ogg") or name.endswith(".opus"):
        return "audio/ogg"
    if name.endswith(".mp4") or name.endswith(".m4a"):
        return "audio/mp4"
    return "application/octet-stream"
