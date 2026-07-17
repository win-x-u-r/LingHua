"""Arabic ↔ Chinese translation.

Primary: Anthropic Claude (paid, high quality — migrated off Huawei NLP now
that the vouchers are gone). Free fallbacks kept for reliability.

Providers, in order:
  1. Claude (paid, primary)
  2. Google Translate free unofficial endpoint (defensive, no key, no cost)
  3. MyMemory crowdsourced (last resort — output is validated to reject junk)

Output is validated to make sure we never return implausible/spam text.
"""

import re
import time
import logging
import requests as http_requests
from anthropic import Anthropic
from config import Config

logger = logging.getLogger(__name__)

# Human-readable language names for the Claude prompt.
LANG_NAMES = {
    "ar": "Arabic",
    "zh": "Chinese (Simplified Mandarin)",
    "en": "English",
}

# Sanity checks: catch obviously-wrong output (e.g. MyMemory returning ad text).
_BAD_PHRASES = (
    "tradiction google",
    "mymemory warning",
    "query length limit",
    "you used all available",
    "translator says",
    "click here",
)

# Character-class regexes for target-language sanity check
_RE_HAS_CJK = re.compile(r"[一-鿿]")
_RE_HAS_ARABIC = re.compile(r"[؀-ۿݐ-ݿ]")


def _is_plausible_translation(text: str, target: str) -> bool:
    """Heuristic: does the candidate look like the target language?"""
    if not text:
        return False
    lower = text.lower().strip()
    for bad in _BAD_PHRASES:
        if bad in lower:
            return False
    if target.startswith("zh") and not _RE_HAS_CJK.search(text):
        return False
    if target.startswith("ar") and not _RE_HAS_ARABIC.search(text):
        return False
    if target == "en" and (_RE_HAS_CJK.search(text) or _RE_HAS_ARABIC.search(text)):
        return False
    return True


def translate_text(text: str, source: str, target: str) -> str:
    """Translate text between languages. Raises RuntimeError if every provider fails."""
    logger.info("Translate: %s -> %s, %d chars: %r", source, target, len(text), text[:80])
    if source == target:
        return text

    for name, fn in (("Claude", _translate_claude),
                     ("Google", _translate_google),
                     ("MyMemory", _translate_mymemory)):
        t0 = time.perf_counter()
        try:
            out = fn(text, source, target)
            elapsed = time.perf_counter() - t0
            if _is_plausible_translation(out, target):
                logger.info("Translate ok via %s in %.2fs: %r", name, elapsed, out[:80])
                return out
            logger.warning("Translate %s returned implausible output in %.2fs: %r",
                           name, elapsed, out[:120])
        except Exception as e:
            logger.warning("Translate %s failed in %.2fs: %s",
                           name, time.perf_counter() - t0, e)

    logger.error("Translate: all providers failed for %s -> %s", source, target)
    raise RuntimeError("All translation providers failed or returned invalid output")


def _translate_claude(text: str, source: str, target: str) -> str:
    """Translate via Anthropic Claude."""
    if not Config.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")

    src_name = LANG_NAMES.get(source, source)
    tgt_name = LANG_NAMES.get(target, target)

    client = Anthropic(api_key=Config.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            f"You are a professional translator. Translate the user's {src_name} "
            f"text into natural, idiomatic {tgt_name}. Output ONLY the translation "
            "— no preamble, no romanization, no quotes, no explanation."
        ),
        messages=[{"role": "user", "content": text}],
    )
    return response.content[0].text.strip()


def _translate_google(text: str, source: str, target: str) -> str:
    """Free unofficial Google Translate endpoint. No API key, reliable quality."""
    google_lang = {"zh": "zh-CN", "ar": "ar", "en": "en"}
    src = google_lang.get(source, source)
    tgt = google_lang.get(target, target)

    response = http_requests.get(
        "https://translate.googleapis.com/translate_a/single",
        params={"client": "gtx", "sl": src, "tl": tgt, "dt": "t", "q": text},
        timeout=10,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()
    data = response.json()

    if not data or not data[0]:
        raise ValueError("Empty Google translation response")
    parts = [seg[0] for seg in data[0] if isinstance(seg, list) and seg and seg[0]]
    if not parts:
        raise ValueError("No translated segments in Google response")
    return "".join(parts).strip()


def _translate_mymemory(text: str, source: str, target: str) -> str:
    """MyMemory crowdsourced translation API (free, no key, often noisy)."""
    mm_lang = {"zh": "zh-CN", "ar": "ar", "en": "en"}
    src = mm_lang.get(source, source)
    tgt = mm_lang.get(target, target)

    response = http_requests.get(
        "https://api.mymemory.translated.net/get",
        params={"q": text, "langpair": f"{src}|{tgt}"},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    if data.get("responseStatus") == 200:
        translated = data["responseData"]["translatedText"]
        if translated:
            return translated
    raise ValueError(f"MyMemory translation failed: {data.get('responseStatus')}")
