"""Arabic ↔ Chinese translation service.

Attempts Huawei Cloud NLP Machine Translation first, then falls back to
better-quality alternatives if the primary fails. Output is validated to
make sure we never return junk strings (e.g. "tradiction google" that
crowdsourced MT memories sometimes return as cached entries).
"""

import re
import requests as http_requests
from config import Config

# Huawei NLP supported language codes
LANG_MAP = {
    "ar": "ar",
    "zh": "zh",
    "en": "en",
}

# Sanity checks: detect output that obviously doesn't match the target language.
# These catch the most common failure mode where MyMemory returns ad / spam text
# instead of an actual translation.
_BAD_PHRASES = (
    "tradiction google",  # known MyMemory junk
    "mymemory warning",
    "query length limit",
    "you used all available",
    "translator says",
    "click here",
)

# Character-class regexes for target-language sanity check
_RE_HAS_CJK = re.compile(r"[一-鿿]")            # Chinese ideographs
_RE_HAS_ARABIC = re.compile(r"[؀-ۿݐ-ݿ]")
_RE_ONLY_LATIN_ASCII = re.compile(r"^[\sA-Za-z0-9.,!?;:'\"()\-]+$")


def _is_plausible_translation(text: str, target: str) -> bool:
    """Heuristic check: does the candidate translation look like the target language?"""
    if not text:
        return False
    lower = text.lower().strip()
    for bad in _BAD_PHRASES:
        if bad in lower:
            return False
    # Translating TO Chinese — expect at least one CJK ideograph
    if target.startswith("zh"):
        if not _RE_HAS_CJK.search(text):
            return False
    # Translating TO Arabic — expect at least one Arabic letter
    if target.startswith("ar"):
        if not _RE_HAS_ARABIC.search(text):
            return False
    # Translating TO English — must contain only Latin/ASCII-ish chars (no CJK / Arabic)
    if target == "en":
        if _RE_HAS_CJK.search(text) or _RE_HAS_ARABIC.search(text):
            return False
    return True


def translate_text(text: str, source: str, target: str) -> str:
    """Translate text between Arabic and Chinese.

    Order of providers:
      1. Huawei Cloud NLP Machine Translation (primary — the Huawei-powered path)
      2. Google Translate public endpoint (high-quality fallback, no API key)
      3. MyMemory (only if output passes plausibility checks)

    Raises RuntimeError if every provider fails or returns implausible output.
    """
    if source == target:
        return text

    src = LANG_MAP.get(source, source)
    tgt = LANG_MAP.get(target, target)

    # 1. Huawei Cloud NLP SDK (Machine Translation in cn-north-4)
    try:
        out = _translate_huawei_sdk(text, src, tgt)
        if _is_plausible_translation(out, tgt):
            return out
        print(f"[Translation] Huawei returned implausible output: {out!r}")
    except Exception as e:
        print(f"[Translation] Huawei SDK failed: {e}")

    # 2. Google Translate (free unofficial endpoint, very reliable)
    try:
        out = _translate_google(text, src, tgt)
        if _is_plausible_translation(out, tgt):
            return out
        print(f"[Translation] Google returned implausible output: {out!r}")
    except Exception as e:
        print(f"[Translation] Google fallback failed: {e}")

    # 3. MyMemory (last resort) — only return if output passes plausibility
    try:
        out = _translate_mymemory(text, src, tgt)
        if _is_plausible_translation(out, tgt):
            return out
        print(f"[Translation] MyMemory returned junk: {out!r}")
    except Exception as e:
        print(f"[Translation] MyMemory fallback failed: {e}")

    raise RuntimeError("All translation providers failed or returned invalid output")


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

    raise ValueError("Unexpected Huawei translation response format")


def _translate_google(text: str, source: str, target: str) -> str:
    """Free unofficial Google Translate endpoint. No API key, very reliable quality."""
    # Google uses zh-CN / zh-TW; map our short codes to its expected codes
    google_lang = {"zh": "zh-CN", "ar": "ar", "en": "en"}
    src = google_lang.get(source, source)
    tgt = google_lang.get(target, target)

    response = http_requests.get(
        "https://translate.googleapis.com/translate_a/single",
        params={
            "client": "gtx",
            "sl": src,
            "tl": tgt,
            "dt": "t",
            "q": text,
        },
        timeout=10,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()
    data = response.json()

    # Response shape: [[[translated, original, ...], ...], ...]
    if not data or not data[0]:
        raise ValueError("Empty Google translation response")

    # Concatenate all segments in case the text was split
    parts = [seg[0] for seg in data[0] if isinstance(seg, list) and seg and seg[0]]
    if not parts:
        raise ValueError("No translated segments in Google response")

    return "".join(parts).strip()


def _translate_mymemory(text: str, source: str, target: str) -> str:
    """MyMemory crowdsourced translation API (free, no key, often noisy)."""
    # MyMemory expects zh-CN for Chinese
    mm_lang = {"zh": "zh-CN", "ar": "ar", "en": "en"}
    src = mm_lang.get(source, source)
    tgt = mm_lang.get(target, target)

    lang_pair = f"{src}|{tgt}"
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
