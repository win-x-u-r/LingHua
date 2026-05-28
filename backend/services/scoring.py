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
import difflib
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


def _syllable_to_arabic(base: str) -> str:
    """Convert one toneless pinyin syllable (e.g. 'hao') to its Arabic
    phonetic approximation using greedy 3/2/1-char chunk matching."""
    base = base.lower()
    arabic = ""
    i = 0
    while i < len(base):
        matched = False
        for length in (3, 2, 1):
            chunk = base[i:i + length]
            if chunk in _PINYIN_TO_ARABIC:
                arabic += _PINYIN_TO_ARABIC[chunk]
                i += length
                matched = True
                break
        if not matched:
            arabic += base[i]
            i += 1
    return arabic


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
        # Remove tone number, then map the bare syllable
        base = re.sub(r'[0-9]', '', s[0].lower())
        result.append(_syllable_to_arabic(base))
    return " ".join(result)


def _char_segments(clean: str) -> list[dict]:
    """Build per-character data for a clean (punctuation-free) Chinese string.

    Returns one entry per character: {char, pinyin (toned), tone (1-5),
    base (toneless pinyin), arabic}. pypinyin yields one syllable per Han
    character, so this aligns 1:1 with the characters.
    """
    chars = list(clean)
    toned = pinyin(clean, style=Style.TONE, heteronym=False)
    numbered = pinyin(clean, style=Style.TONE3, heteronym=False)
    n = min(len(chars), len(toned), len(numbered))
    segments = []
    for i in range(n):
        num_syl = numbered[i][0].lower()
        base = re.sub(r'[0-9]', '', num_syl)
        digit = re.search(r'[1-5]', num_syl)
        segments.append({
            "char": chars[i],
            "pinyin": toned[i][0],
            "tone": int(digit.group()) if digit else 5,
            "base": base,
            "arabic": _syllable_to_arabic(base),
        })
    return segments


def _build_segments(expected_clean: str, actual_clean: str) -> list[dict]:
    """Produce per-character correctness for color-coded feedback.

    Aligns the recognized syllables to the expected ones on base (toneless)
    pinyin so homophones count as a sound-match while still flagging the
    wrong character. Each returned segment marks char/pinyin/tone correctness.
    """
    expected = _char_segments(expected_clean)
    if not expected:
        return []
    recognized = _char_segments(actual_clean)

    exp_base = [s["base"] for s in expected]
    rec_base = [s["base"] for s in recognized]

    # Map each expected index -> recognized index (or None) via alignment.
    mapping: dict[int, int] = {}
    matcher = difflib.SequenceMatcher(None, exp_base, rec_base, autojunk=False)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                mapping[i1 + k] = j1 + k
        elif tag == "replace":
            for k in range(i2 - i1):
                rj = j1 + k
                mapping[i1 + k] = rj if rj < j2 else None
        elif tag == "delete":
            for k in range(i1, i2):
                mapping[k] = None
        # "insert": extra recognized syllables, nothing to map for expected

    result = []
    for i, seg in enumerate(expected):
        j = mapping.get(i)
        if j is None:
            char_ok = pinyin_ok = tone_ok = False
        else:
            rec = recognized[j]
            pinyin_ok = seg["base"] == rec["base"]
            tone_ok = seg["tone"] == rec["tone"]
            char_ok = seg["char"] == rec["char"]
        result.append({
            "char": seg["char"],
            "pinyin": seg["pinyin"],
            "tone": seg["tone"],
            "arabic": seg["arabic"],
            "char_correct": char_ok,
            "pinyin_correct": pinyin_ok,
            "tone_correct": tone_ok,
        })
    return result


def get_breakdown(text: str) -> list[dict]:
    """Per-character phoneme breakdown (no scoring) for clickable practice.

    Returns one entry per character: {char, pinyin, tone, arabic}. Used by the
    /breakdown endpoint so learners can tap any character / pinyin / tone /
    Arabic segment to hear that sound, without needing a recording.
    """
    clean = _strip_punctuation(text)
    return [
        {"char": s["char"], "pinyin": s["pinyin"], "tone": s["tone"], "arabic": s["arabic"]}
        for s in _char_segments(clean)
    ]


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
            "segments": [],
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
        "segments": _build_segments(expected_clean, actual_clean),
        "breakdown": {
            "character": {"score": int(round(char_score)), "weight": 40, "label": "Character Accuracy"},
            "pinyin": {"score": int(round(pinyin_score)), "weight": 35, "label": "Pinyin Similarity"},
            "tone": {"score": int(round(tone_score)), "weight": 25, "label": "Tone Accuracy"},
        },
    }
