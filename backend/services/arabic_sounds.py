"""Arabic sound guides for Mandarin syllables, fully voweled.

Matches the hand-written guides in the lessons (src/content), for example
你好 نِي هَاوْ, 老师 لَاوْ شْ, 再见 دْزَايْ جِيَانْ: a fatha before alif, a sukun on
a closing و, ي or ن, -ng written نْغ, and the buzzing zi/ci/si and
zhi/chi/shi/ri written with a short vowel or none.
"""

from typing import Optional

INIT = {"b": "ب", "p": "ب", "m": "م", "f": "ف", "d": "د", "t": "ت", "n": "ن", "l": "ل",
        "g": "ك", "k": "ك", "h": "ه", "j": "ج", "q": "تْش", "x": "ش", "zh": "ج", "ch": "تْش",
        "sh": "ش", "r": "ر", "z": "دْز", "c": "تْس", "s": "س"}
FIN = {"a": "َا", "o": "ُو", "e": "َه", "ai": "َايْ", "ei": "َيْ", "ao": "َاوْ", "ou": "ُو",
       "an": "َانْ", "en": "ِنْ", "ang": "َانْغ", "eng": "َنْغ", "ong": "ُونْغ",
       "i": "ِي", "ia": "ِيَا", "ie": "ْيِه", "iao": "ِيَاوْ", "iu": "ِيُو", "ian": "ِيَانْ",
       "in": "ِينْ", "iang": "ِيَانْغ", "ing": "ِينْغ", "iong": "ِيُونْغ",
       "u": "ُو", "ua": "ْوَا", "uo": "ْوُو", "uai": "ْوَايْ", "ui": "ْوَيْ", "uan": "ْوَانْ",
       "un": "ُونْ", "uang": "ْوَانْغ",
       "v": "ْيُو", "ve": "ْيُوِه", "van": "ْيُوَانْ", "vn": "ْيُونْ"}
ZERO = {"a": "آ", "o": "أُو", "e": "أَه", "ai": "آيْ", "ei": "أَيْ", "ao": "آوْ", "ou": "أُو",
        "an": "آنْ", "en": "أَنْ", "ang": "آنْغ", "eng": "أَنْغ", "er": "أَرْ",
        "yi": "يِي", "ya": "يَا", "yao": "يَاوْ", "yan": "يَانْ", "yang": "يَانْغ", "ye": "يِه",
        "yin": "يِينْ", "ying": "يِينْغ", "yong": "يُونْغ", "you": "يُو", "yu": "يُوي",
        "yue": "يُوِه", "yuan": "يُوَانْ", "yun": "يُونْ",
        "wu": "وُو", "wa": "وَا", "wo": "وُو", "wai": "وَايْ", "wei": "وَيْ", "wan": "وَانْ",
        "wen": "وِنْ", "wang": "وَانْغ", "weng": "وَنْغ"}

G = {
    "bpm": "a o e ai ei ao an en ang eng i ie iao ian in ing u ou iu",
    "f": "a o ei ou an en ang eng u",
    "dt": "a e ai ei ao ou an en ang eng ong i ie iao iu ian ing u uo ui uan un ia",
    "nl": "a e ai ei ao ou an en ang eng ong i ia ie iao iu ian in iang ing u uo uan un v ve o",
    "gkh": "a e ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang",
    "jqx": "i ia ie iao iu ian in iang ing iong u ue uan un",
    "zh ch sh r": "a e ai ei ao ou an en ang eng ong i u ua uo uai ui uan un uang",
    "zcs": "a e ai ei ao ou an en ang eng ong i u uo ui uan un",
}
VALID = set(ZERO)
for k, fins in G.items():
    inits = k.split() if " " in k else list(k)
    for i in inits:
        for f in fins.split():
            VALID.add(i + f)


def syllable_to_arabic(syl: str) -> Optional[str]:
    """One toneless pinyin syllable (ü may be written v), e.g. "hao" -> هَاوْ.
    Returns None for anything that is not a Mandarin syllable."""
    syl = syl.lower().replace("ü", "v").replace("u:", "v")
    er = ""
    if syl not in VALID and syl.endswith("r") and syl[:-1] in VALID:
        syl, er = syl[:-1], "رْ"
    if syl not in VALID:
        return None
    if syl in ZERO:
        return ZERO[syl] + er
    for n in (2, 1):
        ini = syl[:n]
        if ini in INIT and (n == 2 or syl[:2] not in INIT):
            fin = syl[n:]
            break
    if ini in ("j", "q", "x") and fin.startswith("u"):
        fin = "v" + fin[1:]
    if fin == "i" and ini in ("z", "c", "s"):
        f = "ِ"
    elif fin == "i" and ini in ("zh", "ch", "sh", "r"):
        f = "ْ"
    else:
        f = FIN[fin]
    c = INIT[ini]
    if ini == "h" and fin.startswith("u"):
        c = "خ"
    return c + f + er
