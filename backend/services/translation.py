"""Arabic ↔ Chinese translation service.

Attempts Huawei Cloud NLP Machine Translation first, then falls back to
a free translation API so the app remains functional during development.
"""

import json
import requests as http_requests
from config import Config

# Huawei NLP supported language codes
LANG_MAP = {
    "ar": "ar",
    "zh": "zh",
    "en": "en",
}


def translate_text(text: str, source: str, target: str) -> str:
    """Translate text between Arabic and Chinese.

    Uses English as a pivot language for Arabic↔Chinese since direct
    translation between these languages may not be supported.

    Args:
        text: The text to translate.
        source: Source language code ("ar" or "zh").
        target: Target language code ("ar" or "zh").

    Returns:
        Translated text string.
    """
    if source == target:
        return text

    src = LANG_MAP.get(source, source)
    tgt = LANG_MAP.get(target, target)

    # Try Huawei Cloud NLP SDK first
    try:
        return _translate_huawei_sdk(text, src, tgt)
    except Exception as e:
        print(f"[Translation Huawei SDK] Failed: {e}")

    # Fallback: free translation via MyMemory API
    try:
        return _translate_mymemory(text, src, tgt)
    except Exception as e:
        print(f"[Translation MyMemory] Failed: {e}")

    # Last resort: pivot through English using MyMemory
    try:
        if src == "ar" and tgt == "zh":
            english = _translate_mymemory(text, "ar", "en")
            return _translate_mymemory(english, "en", "zh-CN")
        elif src == "zh" and tgt == "ar":
            english = _translate_mymemory(text, "zh-CN", "en")
            return _translate_mymemory(english, "en", "ar")
    except Exception as e:
        print(f"[Translation pivot] Failed: {e}")

    raise RuntimeError("All translation methods failed")


def _translate_huawei_sdk(text: str, source: str, target: str) -> str:
    """Call Huawei Cloud Machine Translation via NLP SDK."""
    from utils.huawei_auth import get_nlp_credentials
    from huaweicloudsdknlp.v2 import NlpClient
    from huaweicloudsdknlp.v2.model import (
        RunTextTranslationRequest,
        TextTranslationReq,
    )
    from huaweicloudsdkcore.http.http_config import HttpConfig

    credentials = get_nlp_credentials()
    config = HttpConfig.get_default_config()
    client = (
        NlpClient.new_builder()
        .with_http_config(config)
        .with_credentials(credentials)
        .with_endpoint(Config.nlp_endpoint())
        .build()
    )

    request = RunTextTranslationRequest()
    request.body = TextTranslationReq(
        text=text,
        _from=source,
        to=target,
    )

    response = client.run_text_translation(request)

    if response.translated_text:
        return response.translated_text

    raise ValueError("Unexpected translation response format")


def _translate_mymemory(text: str, source: str, target: str) -> str:
    """Free translation via MyMemory API (no API key needed)."""
    # MyMemory uses standard language codes
    lang_pair = f"{source}|{target}"
    response = http_requests.get(
        "https://api.mymemory.translated.net/get",
        params={"q": text, "langpair": lang_pair},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    if data.get("responseStatus") == 200:
        translated = data["responseData"]["translatedText"]
        if translated:
            return translated

    raise ValueError(f"MyMemory translation failed: {data.get('responseStatus')}")
