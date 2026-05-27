"""Arabic Text-to-Speech via Munsit (UAE-based, dialect-aware).

Replaces Huawei SIS RTTS for Arabic playback. Munsit's "Faseeh" models speak
natural Gulf/Egyptian/MSA Arabic and stream PCM16 audio at 24 kHz, which is
significantly faster than Huawei's WebSocket RTTS round-trip.

The endpoint streams raw PCM; we buffer the full stream and wrap it in a
WAV header so it can be played by any standard HTML5 audio element.

API: POST https://api.munsit.com/api/v1/text-to-speech/{model_id}
Auth: x-api-key header
Request: JSON { voice_id, text, stability, speed, streaming: true }
Response: streamed PCM16, mono, 24 kHz
"""

import struct
import threading
import requests as http_requests
from config import Config

# Cached voice list — fetched lazily on first synth call, then reused.
_voice_cache_lock = threading.Lock()
_voice_cache: list[dict] | None = None
_chosen_voice_id: str | None = None

# Munsit streams PCM16 at this rate; do not change unless their docs change.
MUNSIT_PCM_SAMPLE_RATE = 24000
MUNSIT_PCM_CHANNELS = 1
MUNSIT_PCM_SAMPLE_WIDTH = 2  # 16-bit


def synthesize_arabic(text: str) -> bytes:
    """Generate Arabic speech audio. Returns WAV bytes ready to send to the client."""
    if not Config.MUNSIT_API_KEY:
        raise RuntimeError("MUNSIT_API_KEY is not configured")

    voice_id = _resolve_voice_id()
    model_id = Config.MUNSIT_TTS_MODEL

    url = f"{Config.MUNSIT_API_BASE}/text-to-speech/{model_id}"
    headers = {
        "x-api-key": Config.MUNSIT_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "voice_id": voice_id,
        "text": text,
        "stability": 0.5,
        "speed": 1.0,
        "streaming": True,
    }

    response = http_requests.post(
        url, json=payload, headers=headers, stream=True, timeout=60
    )
    response.raise_for_status()

    # Drain the streaming PCM body
    pcm_chunks = []
    for chunk in response.iter_content(chunk_size=8192):
        if chunk:
            pcm_chunks.append(chunk)
    pcm_data = b"".join(pcm_chunks)

    if not pcm_data:
        raise ValueError("Munsit TTS returned empty audio stream")

    return _pcm_to_wav(
        pcm_data,
        sample_rate=MUNSIT_PCM_SAMPLE_RATE,
        channels=MUNSIT_PCM_CHANNELS,
        sample_width=MUNSIT_PCM_SAMPLE_WIDTH,
    )


def _resolve_voice_id() -> str:
    """Get the voice_id to use, either from env or by picking one from the API."""
    if Config.MUNSIT_TTS_VOICE_ID:
        return Config.MUNSIT_TTS_VOICE_ID

    global _chosen_voice_id
    if _chosen_voice_id:
        return _chosen_voice_id

    with _voice_cache_lock:
        # Re-check inside the lock
        if _chosen_voice_id:
            return _chosen_voice_id

        voices = _fetch_voices()

        # Munsit's voice records:
        #   - dialect:   list[str]    e.g. ["emirati"], ["fusha"], ["british"]
        #   - languages: list[str]    e.g. ["en", "ar"]
        #   - gender:    str          e.g. "Female", "Male"
        def dialects_of(v: dict) -> list[str]:
            d = v.get("dialect") or []
            if isinstance(d, str):
                d = [d]
            return [str(x).lower() for x in d]

        def languages_of(v: dict) -> list[str]:
            ls = v.get("languages") or []
            if isinstance(ls, str):
                ls = [ls]
            return [str(x).lower() for x in ls]

        def gender_of(v: dict) -> str:
            return str(v.get("gender") or "").lower()

        # Only consider voices that actually speak Arabic
        ar_voices = [v for v in voices if "ar" in languages_of(v)]
        if not ar_voices:
            raise RuntimeError("Munsit returned no Arabic-speaking voices")

        # Preference order:
        #   1. Emirati female → Emirati male
        #   2. Gulf dialects (najdi, hijazi, qatari, bahraini, kuwaiti, omani) female → male
        #   3. Fusha (MSA) female → male
        #   4. First available Arabic voice
        GULF = ("najdi", "hijazi", "qatari", "bahraini", "kuwaiti", "omani")

        def pick_by_dialects(targets: tuple[str, ...]) -> dict | None:
            matches = [
                v for v in ar_voices
                if any(d in targets for d in dialects_of(v))
            ]
            if not matches:
                return None
            females = [v for v in matches if gender_of(v) == "female"]
            return females[0] if females else matches[0]

        picked = (
            pick_by_dialects(("emirati",))
            or pick_by_dialects(GULF)
            or pick_by_dialects(("fusha",))
            or ar_voices[0]
        )

        _chosen_voice_id = picked["voice_id"]
        # Avoid non-ASCII characters in print — Windows console (cp1252) chokes on them.
        print(
            f"[Munsit TTS] Auto-selected voice: "
            f"{picked.get('name', '?')} "
            f"(dialect={picked.get('dialect')}, gender={picked.get('gender')}) "
            f"-> voice_id={_chosen_voice_id}",
            flush=True,
        )
        return _chosen_voice_id


def _fetch_voices() -> list[dict]:
    """Fetch the list of available voices from Munsit (cached after first call)."""
    global _voice_cache
    if _voice_cache is not None:
        return _voice_cache

    url = f"{Config.MUNSIT_API_BASE}/voices"
    headers = {"x-api-key": Config.MUNSIT_API_KEY}
    response = http_requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()

    payload = response.json()
    # The API may return either a bare list or { voices: [...] }
    if isinstance(payload, list):
        voices = payload
    elif isinstance(payload, dict):
        voices = payload.get("voices") or payload.get("data") or []
    else:
        voices = []

    if not voices:
        raise ValueError(f"Munsit /voices returned unexpected payload: {payload!r}")

    _voice_cache = voices
    return voices


def _pcm_to_wav(
    pcm_data: bytes,
    sample_rate: int,
    channels: int,
    sample_width: int,
) -> bytes:
    """Wrap raw PCM bytes in a RIFF WAV header so they can be played by <audio>."""
    data_size = len(pcm_data)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,
        1,  # PCM format code
        channels,
        sample_rate,
        sample_rate * channels * sample_width,
        channels * sample_width,
        sample_width * 8,
        b"data",
        data_size,
    )
    return header + pcm_data
