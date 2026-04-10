"""Text-to-Speech using Huawei Cloud SIS Real-Time TTS (WebSocket).

The international SIS (me-east-1) only supports Real-Time TTS via WebSocket,
not the batch REST endpoint available in China-mainland regions.

Available voices in me-east-1:
    arabic_dh_female (Aisha), arabic_dh_male (Ahmed)
    english_dh_female (Aisha), english_dh_male (Ahmed)

Chinese TTS is NOT available in me-east-1.
"""

import json
import struct
import threading
from config import Config

VOICE_MAP = {
    "ar": "arabic_dh_female",
    "en": "english_dh_female",
}


def text_to_speech(text: str, lang: str) -> bytes:
    """Convert text to speech audio using Huawei Cloud SIS RTTS.

    For Chinese text, converts to pinyin first and uses the English voice,
    since Chinese TTS voices are not available in the me-east-1 region.

    Args:
        text: The text to convert to speech.
        lang: Language code ("zh", "ar", "en").

    Returns:
        Audio bytes (WAV format).
    """
    voice = VOICE_MAP.get(lang, "english_dh_female")

    # Chinese: convert to pinyin with tone marks so the English voice
    # speaks the romanized pronunciation (e.g. "nǐ hǎo")
    # Chinese TTS is not available on Huawei SIS international regions.
    # Return a signal so the frontend uses browser speech synthesis instead.
    if lang == "zh":
        from flask import jsonify
        raise ValueError("BROWSER_TTS_CHINESE")

    pcm_data = _rtts_websocket(text, voice)
    return _pcm_to_wav(pcm_data, sample_rate=16000)


def _rtts_websocket(text: str, voice: str) -> bytes:
    """Call Real-Time TTS via WebSocket."""
    import websocket
    from utils.huawei_auth import get_iam_token

    token = get_iam_token()
    project_id = Config.HUAWEI_SIS_PROJECT_ID
    url = f"wss://sis-ext.{Config.HUAWEI_SIS_REGION}.myhuaweicloud.com/v1/{project_id}/rtts"

    audio_chunks = []
    error_msg = [None]
    done_event = threading.Event()

    def on_message(ws, message):
        if isinstance(message, bytes):
            audio_chunks.append(message)
        else:
            data = json.loads(message)
            resp_type = data.get("resp_type", "")
            if resp_type == "END":
                done_event.set()
                ws.close()
            elif resp_type == "ERROR":
                error_msg[0] = data.get("error_msg", "Unknown RTTS error")
                done_event.set()
                ws.close()

    def on_error(ws, error):
        error_msg[0] = str(error)
        done_event.set()

    def on_open(ws):
        start_msg = {
            "command": "START",
            "text": text,
            "config": {
                "audio_format": "pcm",
                "sample_rate": "16000",
                "property": voice,
            },
        }
        ws.send(json.dumps(start_msg))

    ws = websocket.WebSocketApp(
        url,
        header={"X-Auth-Token": token},
        on_message=on_message,
        on_error=on_error,
        on_open=on_open,
    )

    thread = threading.Thread(target=ws.run_forever)
    thread.start()
    done_event.wait(timeout=30)

    if not done_event.is_set():
        ws.close()
        raise TimeoutError("RTTS WebSocket timed out after 30s")

    if error_msg[0]:
        raise RuntimeError(f"RTTS error: {error_msg[0]}")

    return b"".join(audio_chunks)


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 16000,
                channels: int = 1, sample_width: int = 2) -> bytes:
    """Wrap raw PCM data in a WAV header."""
    data_size = len(pcm_data)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,  # chunk size
        1,   # PCM format
        channels,
        sample_rate,
        sample_rate * channels * sample_width,  # byte rate
        channels * sample_width,  # block align
        sample_width * 8,  # bits per sample
        b"data",
        data_size,
    )
    return header + pcm_data
