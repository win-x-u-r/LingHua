"""Text-to-Speech using Huawei Cloud SIS Real-Time TTS (WebSocket).

The international SIS (me-east-1) only supports Real-Time TTS via WebSocket,
not the batch REST endpoint available in China-mainland regions.

Available voices in me-east-1:
    arabic_dh_female (Aisha), arabic_dh_male (Ahmed)
    english_dh_female (Aisha), english_dh_male (Ahmed)

Chinese TTS is NOT available in me-east-1.
"""

import json
import re
import struct
import threading
from config import Config

VOICE_MAP = {
    "ar": "arabic_dh_female",
    "en": "english_dh_female",
}


def _extract_chinese(text: str) -> str:
    """Strip markdown and English from text, keeping only Chinese characters and punctuation."""
    # Remove markdown: headers, bold, italic, blockquotes, horizontal rules, bullets
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*{1,3}', '', text)
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^-{3,}$', '', text, flags=re.MULTILINE)
    # Remove pinyin/English in parentheses
    text = re.sub(r'\([^)]*\)', '', text)
    # Remove correction emoji prefix
    text = re.sub(r'✏️\s*', '', text)
    # Keep only Chinese characters + Chinese punctuation + whitespace
    text = re.sub(r'[^一-鿿　-〿＀-￯ \n。，！？；：""''…—～]', ' ', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def text_to_speech(text: str, lang: str) -> bytes:
    """Convert text to speech audio.

    Routing:
      - ElevenLabs key set: use it for ALL languages (multilingual voice).
      - Chinese (no ElevenLabs): signals the frontend to use browser SpeechSynthesis.
      - Arabic (no ElevenLabs): prefers Munsit, falls back to Huawei SIS RTTS.
      - English/other (no ElevenLabs): Huawei SIS RTTS.

    Returns:
        Audio bytes (WAV or MP3 format).
    """
    # ElevenLabs handles all languages when key is available
    if Config.ELEVENLABS_API_KEY:
        # Strip parenthetical pinyin annotations and punctuation the voice shouldn't read
        clean = re.sub(r'\([^)]*\)', '', text)          # remove (pinyin)
        clean = re.sub(r'[,،،.。!！?？;；:：—–\-]+', ' ', clean)  # punctuation → space
        clean = re.sub(r'\s+', ' ', clean).strip()
        return _elevenlabs_tts(clean or text)

    # --- Fallback routing (no ElevenLabs) ---

    # Chinese: browser TTS
    if lang == "zh":
        raise ValueError("BROWSER_TTS_CHINESE")

    # Arabic: prefer Munsit's dialect-aware TTS
    if lang == "ar" and Config.MUNSIT_API_KEY:
        try:
            from services.munsit_tts import synthesize_arabic
            return synthesize_arabic(text)
        except Exception as e:
            print(f"[TTS] Munsit Arabic TTS failed, falling back to Huawei SIS: {e}")

    # Everything else (English, Arabic-fallback): Huawei SIS RTTS
    voice = VOICE_MAP.get(lang, "english_dh_female")
    pcm_data = _rtts_websocket(text, voice)
    return _pcm_to_wav(pcm_data, sample_rate=16000)


def _elevenlabs_tts(text: str) -> bytes:
    """Generate speech via ElevenLabs API (multilingual v2 — supports Chinese)."""
    import requests as http_requests

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{Config.ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": Config.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": Config.ELEVENLABS_MODEL,
        "speed": 1.15,               # slightly faster, especially helps Chinese pacing
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.8,
            "style": 0.55,
            "use_speaker_boost": True,
        },
    }

    response = http_requests.post(url, json=payload, headers=headers, timeout=30)
    if not response.ok:
        raise RuntimeError(f"ElevenLabs TTS failed: {response.status_code} {response.text}")

    return response.content


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
