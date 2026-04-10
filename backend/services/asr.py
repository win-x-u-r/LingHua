"""Automatic Speech Recognition using Huawei Cloud Speech Interaction Service (SIS).

Converts student speech recordings to text for pronunciation evaluation.
Supports Chinese Mandarin recognition for pronunciation practice.

All SDK imports are deferred to function call time so the app can start
without the Huawei SDK installed (for local development).
"""

from config import Config
from utils.audio import convert_to_pcm, audio_to_base64, detect_audio_format

# Huawei SIS ASR language models
ASR_MODELS = {
    "zh": "chinese_16k_general",
    "ar": "arabic_16k_general",
}


def speech_to_text(audio_bytes: bytes, filename: str = "audio.webm", lang: str = "zh") -> str:
    """Convert speech audio to text using Huawei Cloud SIS ASR.

    Tries the SDK client first, falls back to signed REST.

    Args:
        audio_bytes: Raw audio file bytes from the client.
        filename: Original filename (used to detect format).
        lang: Expected language ("zh" for Chinese, "ar" for Arabic).

    Returns:
        Recognized text string.
    """
    # Convert to PCM WAV format that Huawei SIS expects
    source_format = detect_audio_format(filename)
    wav_bytes = convert_to_pcm(audio_bytes, source_format)
    audio_b64 = audio_to_base64(wav_bytes)
    asr_model = ASR_MODELS.get(lang, ASR_MODELS["zh"])

    try:
        return _asr_via_sdk(audio_b64, asr_model)
    except ImportError:
        return _asr_via_rest(audio_b64, asr_model)


def _asr_via_sdk(audio_b64: str, asr_model: str) -> str:
    """Call ASR using the Huawei SIS SDK client."""
    from utils.huawei_auth import get_credentials
    from huaweicloudsdksis.v1 import SisClient
    from huaweicloudsdksis.v1.model import (
        RecognizeShortAudioRequest,
        PostShortAudioReq,
        TranscriberConfig,
    )
    from huaweicloudsdkcore.http.http_config import HttpConfig

    credentials = get_credentials()
    config = HttpConfig.get_default_config()
    client = (
        SisClient.new_builder()
        .with_http_config(config)
        .with_credentials(credentials)
        .with_endpoint(Config.sis_endpoint())
        .build()
    )

    asr_config = TranscriberConfig(
        audio_format="wav",
        _property=asr_model,
        add_punc="yes",
    )

    request = RecognizeShortAudioRequest()
    request.body = PostShortAudioReq(data=audio_b64, config=asr_config)

    try:
        response = client.recognize_short_audio(request)
    except Exception as e:
        print(f"[ASR SDK ERROR] {e}")
        raise

    if response.result and response.result.text:
        return response.result.text

    # No text recognized — return empty string instead of crashing
    return ""


def _asr_via_rest(audio_b64: str, asr_model: str) -> str:
    """Fallback: call ASR via direct REST with SDK signing."""
    import requests as http_requests
    from utils.huawei_auth import get_credentials

    try:
        from huaweicloudsdkcore.signer.signer import Signer
        from huaweicloudsdkcore.sdk_request import SdkRequest
    except ImportError as e:
        raise RuntimeError(f"Huawei Cloud SDK required for ASR: {e}")

    credentials = get_credentials()
    url = f"{Config.sis_endpoint()}/v1/{Config.HUAWEI_SIS_PROJECT_ID}/asr/short-audio"
    payload = {
        "data": audio_b64,
        "config": {
            "audio_format": "wav",
            "property": asr_model,
            "add_punc": "yes",
        },
    }

    sdk_request = SdkRequest(
        method="POST",
        schema="https",
        host=Config.sis_endpoint().replace("https://", ""),
        resource_path=f"/v1/{Config.HUAWEI_SIS_PROJECT_ID}/asr/short-audio",
        header_params={"Content-Type": "application/json"},
        body=payload,
    )
    signed = Signer.sign(sdk_request, credentials)

    response = http_requests.post(
        url,
        json=payload,
        headers=dict(signed.header_params),
        timeout=60,
    )
    response.raise_for_status()

    data = response.json()
    if "result" in data and "text" in data["result"]:
        return data["result"]["text"]

    raise ValueError("Unexpected ASR response format")
