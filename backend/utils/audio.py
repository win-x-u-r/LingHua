"""Audio format conversion utilities for Huawei Cloud SIS compatibility."""

import os
import base64
import tempfile
from pydub import AudioSegment
from config import Config


def convert_to_pcm(audio_bytes: bytes, source_format: str = "webm") -> bytes:
    """Convert audio bytes to PCM 16kHz 16-bit mono WAV for Huawei ASR.

    Args:
        audio_bytes: Raw audio file bytes.
        source_format: Original format (webm, mp4, wav, mp3, ogg).

    Returns:
        WAV audio bytes in the format Huawei SIS expects.
    """
    tmp_in_path = None
    tmp_out_path = None

    try:
        # Write input to temp file
        with tempfile.NamedTemporaryFile(suffix=f".{source_format}", delete=False) as tmp_in:
            tmp_in.write(audio_bytes)
            tmp_in_path = tmp_in.name

        # Convert to target format
        audio = AudioSegment.from_file(tmp_in_path, format=source_format)
        audio = audio.set_frame_rate(Config.AUDIO_SAMPLE_RATE)
        audio = audio.set_channels(Config.AUDIO_CHANNELS)
        audio = audio.set_sample_width(Config.AUDIO_SAMPLE_WIDTH)

        # Export as WAV
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_out:
            tmp_out_path = tmp_out.name
            audio.export(tmp_out_path, format="wav")

        with open(tmp_out_path, "rb") as f:
            return f.read()

    finally:
        # Clean up both temp files regardless of success/failure
        if tmp_in_path and os.path.exists(tmp_in_path):
            os.unlink(tmp_in_path)
        if tmp_out_path and os.path.exists(tmp_out_path):
            os.unlink(tmp_out_path)


def audio_to_base64(audio_bytes: bytes) -> str:
    """Encode audio bytes to base64 string for Huawei API payloads."""
    return base64.b64encode(audio_bytes).decode("utf-8")


def detect_audio_format(filename: str) -> str:
    """Detect audio format from filename extension."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    format_map = {
        "webm": "webm",
        "mp4": "mp4",
        "m4a": "mp4",
        "wav": "wav",
        "mp3": "mp3",
        "ogg": "ogg",
        "oga": "ogg",
        "flac": "flac",
    }
    return format_map.get(ext, "webm")
