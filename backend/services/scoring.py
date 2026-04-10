"""Pronunciation scoring service using MindSpore.

Evaluates how accurately a student pronounced a Mandarin Chinese phrase
by comparing the expected text with the ASR-recognized text. The scoring
model uses MindSpore for tensor operations and a neural similarity network,
making it a core Huawei technology showcase for the ICT Competition.

Scoring dimensions:
  1. Character-level accuracy (40%) — Exact character match ratio
  2. Pinyin similarity (35%) — Syllable-by-syllable phonetic comparison
  3. Tone accuracy (25%) — Mandarin tone mark comparison
"""

import re
from pypinyin import pinyin, Style
from models.pronunciation_model import PronunciationModel

# Singleton model instance (loaded once at startup)
_model = None


def get_model() -> PronunciationModel:
    """Get or initialize the MindSpore pronunciation scoring model."""
    global _model
    if _model is None:
        _model = PronunciationModel()
    return _model


def _strip_punctuation(text: str) -> str:
    """Remove Chinese and ASCII punctuation from text."""
    return re.sub(r'[^\w\s]', '', text, flags=re.UNICODE).strip()


def _get_pinyin_display(text: str) -> str:
    """Get pinyin with tone marks for display (e.g. 'nǐ hǎo')."""
    clean = _strip_punctuation(text)
    if not clean:
        return ""
    syllables = pinyin(clean, style=Style.TONE, heteronym=False)
    return " ".join(s[0] for s in syllables)


def _get_tone_numbers(text: str) -> str:
    """Get pinyin with tone numbers for display (e.g. 'ni3 hao3')."""
    clean = _strip_punctuation(text)
    if not clean:
        return ""
    syllables = pinyin(clean, style=Style.TONE3, heteronym=False)
    return " ".join(s[0] for s in syllables)


# Pinyin syllable to Arabic phonetic approximation
_PINYIN_TO_ARABIC = {
    # Initials
    "b": "\u0628", "p": "\u0628\u0651", "m": "\u0645", "f": "\u0641",
    "d": "\u062f", "t": "\u062a", "n": "\u0646", "l": "\u0644",
    "g": "\u063a", "k": "\u0643", "h": "\u0647",
    "j": "\u062c", "q": "\u062a\u0634", "x": "\u0634",
    "zh": "\u062c", "ch": "\u062a\u0634", "sh": "\u0634", "r": "\u0631",
    "z": "\u0632", "c": "\u062a\u0633", "s": "\u0633",
    "w": "\u0648", "y": "\u064a",
    # Finals / vowels
    "a": "\u0627", "o": "\u0648", "e": "\u0649", "i": "\u064a",
    "u": "\u0648", "v": "\u064a\u0648",
    "ai": "\u0627\u064a", "ei": "\u0627\u064a", "ao": "\u0627\u0648", "ou": "\u0627\u0648",
    "an": "\u0627\u0646", "en": "\u0627\u0646", "ang": "\u0627\u0646\u063a", "eng": "\u0627\u0646\u063a",
    "ong": "\u0648\u0646\u063a", "ing": "\u064a\u0646\u063a",
    "ia": "\u064a\u0627", "ie": "\u064a\u0647", "iu": "\u064a\u0648",
    "ian": "\u064a\u0627\u0646", "iang": "\u064a\u0627\u0646\u063a",
    "iong": "\u064a\u0648\u0646\u063a",
    "ua": "\u0648\u0627", "uo": "\u0648\u0648", "ui": "\u0648\u064a",
    "uan": "\u0648\u0627\u0646", "uang": "\u0648\u0627\u0646\u063a", "un": "\u0648\u0646",
}


def _pinyin_to_arabic(text: str) -> str:
    """Convert pinyin with tone marks to Arabic phonetic approximation.

    This helps Arabic-speaking students understand Mandarin sounds
    using familiar Arabic letters.
    """
    clean = _strip_punctuation(text)
    if not clean:
        return ""
    # Get numbered pinyin for easier parsing
    syllables = pinyin(clean, style=Style.TONE3, heteronym=False)
    result = []
    for s in syllables:
        syl = s[0].lower()
        # Remove tone number
        base = re.sub(r'[0-9]', '', syl)
        arabic = ""
        i = 0
        while i < len(base):
            # Try 3-char, 2-char, then 1-char matches
            matched = False
            for length in (3, 2, 1):
                chunk = base[i:i+length]
                if chunk in _PINYIN_TO_ARABIC:
                    arabic += _PINYIN_TO_ARABIC[chunk]
                    i += length
                    matched = True
                    break
            if not matched:
                arabic += base[i]
                i += 1
        result.append(arabic)
    return " ".join(result)


def score_pronunciation(expected: str, actual: str) -> dict:
    """Score pronunciation accuracy using MindSpore.

    Args:
        expected: The correct Mandarin text the student was supposed to say.
        actual: The text recognized by ASR from the student's speech.

    Returns:
        Dictionary with overall score and per-dimension breakdown.
    """
    if not expected or not actual:
        return {
            "score": 0,
            "recognized": actual or "",
            "expected_pinyin": _get_pinyin_display(expected) if expected else "",
            "expected_arabic": _pinyin_to_arabic(expected) if expected else "",
            "recognized_pinyin": "",
            "recognized_arabic": "",
            "breakdown": {
                "character": {"score": 0, "weight": 40, "label": "Character Accuracy"},
                "pinyin": {"score": 0, "weight": 35, "label": "Pinyin Similarity"},
                "tone": {"score": 0, "weight": 25, "label": "Tone Accuracy"},
            },
        }

    # Strip punctuation so "你好。" matches "你好"
    expected_clean = _strip_punctuation(expected)
    actual_clean = _strip_punctuation(actual)

    model = get_model()
    char_score = model.compute_character_score(expected_clean, actual_clean)
    pinyin_score = model.compute_pinyin_score(expected_clean, actual_clean)
    tone_score = model.compute_tone_score(expected_clean, actual_clean)
    total = model.compute_score(expected_clean, actual_clean)

    return {
        "score": max(0, min(100, int(round(total)))),
        "recognized": actual,
        "expected_pinyin": _get_pinyin_display(expected),
        "expected_arabic": _pinyin_to_arabic(expected),
        "recognized_pinyin": _get_pinyin_display(actual),
        "recognized_arabic": _pinyin_to_arabic(actual),
        "breakdown": {
            "character": {"score": int(round(char_score)), "weight": 40, "label": "Character Accuracy"},
            "pinyin": {"score": int(round(pinyin_score)), "weight": 35, "label": "Pinyin Similarity"},
            "tone": {"score": int(round(tone_score)), "weight": 25, "label": "Tone Accuracy"},
        },
    }
