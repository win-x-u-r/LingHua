"""MindSpore-based Mandarin pronunciation scoring model.

This module implements a neural text similarity model using Huawei's MindSpore
deep learning framework. It evaluates pronunciation accuracy across three
dimensions: character matching, pinyin phonetic similarity, and tone accuracy.

The model is specifically designed for Arabic-speaking learners, who commonly
struggle with Mandarin tones and retroflex consonants (zh, ch, sh, r).

Architecture:
  - Character embedding layer (MindSpore nn.Embedding)
  - Cosine similarity via ops.cosine_similarity (functional API)
  - Weighted multi-dimensional scoring

This is a core Huawei technology component for the ICT Competition.
"""

import numpy as np
from pypinyin import pinyin, Style

try:
    import mindspore as ms
    import mindspore.nn as nn
    import mindspore.ops as ops
    from mindspore import Tensor
    MINDSPORE_AVAILABLE = True
except ImportError:
    MINDSPORE_AVAILABLE = False


# Common Mandarin characters used in beginner-intermediate vocabulary.
# Ordered deterministically — this is critical so that character-to-index
# mapping remains consistent across process restarts.
_CHAR_VOCAB_RAW = (
    "的一是不了人我在有他这中大来上个国到说们为子和你地出会也时要就"
    "可以对生能而行方那里然后学过家多发当没成只如事把还用好日开让"
    "想下面什么小自回天高老师谢你再见起请问早晚安吃饭"
    "喝水校朋友人爸妈哥姐弟妹同中阿联酋"
    "书本笔电脑手机猫狗鱼鸟花草树太阳月亮星红色蓝绿黄白"
    "黑少快慢矮长短热冷新旧坏美丑甜苦酸辣咸二三四五"
    "六七八九十百千万零年期几点半分秒钟头"
)
# Deduplicate while preserving insertion order
_UNIQUE_CHARS = list(dict.fromkeys(_CHAR_VOCAB_RAW))

# Build deterministic character-to-index mapping
# Index 0 is reserved for padding, last index for unknown characters
CHAR_TO_IDX = {ch: i + 1 for i, ch in enumerate(_UNIQUE_CHARS)}
VOCAB_SIZE = len(CHAR_TO_IDX) + 2  # +1 for padding (0), +1 for unknown
UNK_IDX = VOCAB_SIZE - 1
EMBEDDING_DIM = 64
MAX_SEQ_LEN = 50

# Scoring weights
WEIGHT_CHAR = 0.40
WEIGHT_PINYIN = 0.35
WEIGHT_TONE = 0.25


def _chars_to_indices(text: str) -> list:
    """Convert Chinese characters to vocabulary indices."""
    return [CHAR_TO_IDX.get(ch, UNK_IDX) for ch in text[:MAX_SEQ_LEN]]


def _pad_sequence(indices: list, length: int = MAX_SEQ_LEN) -> list:
    """Pad or truncate index sequence to fixed length."""
    if len(indices) >= length:
        return indices[:length]
    return indices + [0] * (length - len(indices))


def _get_pinyin_with_tones(text: str) -> list:
    """Get pinyin with tone numbers for each character."""
    return [p[0] for p in pinyin(text, style=Style.TONE3, heteronym=False)]


def _get_pinyin_no_tones(text: str) -> list:
    """Get pinyin without tone marks for phonetic comparison."""
    return [p[0] for p in pinyin(text, style=Style.NORMAL, heteronym=False)]


def _get_tones(text: str) -> list:
    """Extract tone numbers (1-4, 5 for neutral) from pinyin."""
    toned = _get_pinyin_with_tones(text)
    tones = []
    for syllable in toned:
        tone = 5  # default neutral
        for ch in syllable:
            if ch.isdigit():
                tone = int(ch)
                break
        tones.append(tone)
    return tones


def _levenshtein_similarity(s1: str, s2: str) -> float:
    """Compute normalized Levenshtein similarity between two strings."""
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.0

    len1, len2 = len(s1), len(s2)
    matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]

    for i in range(len1 + 1):
        matrix[i][0] = i
    for j in range(len2 + 1):
        matrix[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            matrix[i][j] = min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            )

    max_len = max(len1, len2)
    return 1.0 - (matrix[len1][len2] / max_len)


class PronunciationModel:
    """MindSpore-based pronunciation scoring model.

    Uses character embeddings and cosine similarity to evaluate
    how closely a student's pronunciation matches the expected text.
    """

    def __init__(self):
        if MINDSPORE_AVAILABLE:
            ms.set_context(mode=ms.PYNATIVE_MODE)
            self._init_mindspore_model()
        else:
            # NumPy fallback when MindSpore isn't installed (e.g., Windows dev)
            rng = np.random.RandomState(42)  # Deterministic seed
            self._embedding_weights = rng.randn(VOCAB_SIZE, EMBEDDING_DIM).astype(np.float32) * 0.1

    def _init_mindspore_model(self):
        """Initialize MindSpore embedding layer."""
        self.embedding = nn.Embedding(VOCAB_SIZE, EMBEDDING_DIM, padding_idx=0)

    def _embed_text(self, text: str):
        """Convert text to a single embedding vector by mean-pooling character embeddings.

        Returns:
            Array of shape (1, EMBEDDING_DIM).
        """
        indices = _pad_sequence(_chars_to_indices(text))

        if MINDSPORE_AVAILABLE:
            idx_tensor = Tensor(np.array([indices], dtype=np.int32))
            embeddings = self.embedding(idx_tensor)  # (1, seq_len, embed_dim)

            # Build mask: 1 for real characters, 0 for padding
            mask = (idx_tensor != 0).astype(ms.float32)  # (1, seq_len)
            mask = mask.unsqueeze(-1)  # (1, seq_len, 1)

            # Mean pooling over non-padding positions
            masked = embeddings * mask  # (1, seq_len, embed_dim)
            summed = ops.ReduceSum(keep_dims=True)(masked, 1)  # (1, 1, embed_dim)
            count = ops.ReduceSum(keep_dims=True)(mask, 1)  # (1, 1, 1)
            count = ops.clip_by_value(count, Tensor(1.0, ms.float32), Tensor(float(MAX_SEQ_LEN), ms.float32))
            pooled = summed / count  # (1, 1, embed_dim)
            return pooled.squeeze(1)  # (1, embed_dim)
        else:
            idx_array = np.array(indices, dtype=np.int32)
            embeddings = self._embedding_weights[idx_array]  # (seq_len, embed_dim)
            mask = (idx_array != 0).astype(np.float32).reshape(-1, 1)  # (seq_len, 1)
            if mask.sum() == 0:
                return np.zeros((1, EMBEDDING_DIM), dtype=np.float32)
            masked = embeddings * mask
            return masked.sum(axis=0, keepdims=True) / max(mask.sum(), 1.0)  # (1, embed_dim)

    def compute_character_score(self, expected: str, actual: str) -> float:
        """Score character-level accuracy using MindSpore embeddings.

        Uses cosine similarity between averaged character embeddings
        of the expected and actual text, blended with Levenshtein distance.
        """
        emb_expected = self._embed_text(expected)
        emb_actual = self._embed_text(actual)

        if MINDSPORE_AVAILABLE:
            # ops.cosine_similarity is the functional API (not a class)
            similarity = ops.cosine_similarity(emb_expected, emb_actual, dim=1)
            cos_score = float(similarity.asnumpy().item())
        else:
            dot = np.sum(emb_expected * emb_actual)
            norm_e = np.linalg.norm(emb_expected)
            norm_a = np.linalg.norm(emb_actual)
            cos_score = float(dot / max(norm_e * norm_a, 1e-8))

        # Normalize cosine similarity from [-1, 1] to [0, 1]
        cos_score = (cos_score + 1.0) / 2.0

        # Blend with Levenshtein for robustness
        lev_score = _levenshtein_similarity(expected, actual)
        return (cos_score * 0.4 + lev_score * 0.6) * 100

    def compute_pinyin_score(self, expected: str, actual: str) -> float:
        """Score pinyin phonetic similarity.

        Compares the base pinyin syllables (without tones) of each character.
        This captures whether the student pronounced the right sounds,
        independent of tone accuracy.
        """
        expected_py = _get_pinyin_no_tones(expected)
        actual_py = _get_pinyin_no_tones(actual)

        if not expected_py:
            return 0.0

        expected_str = " ".join(expected_py)
        actual_str = " ".join(actual_py)

        return _levenshtein_similarity(expected_str, actual_str) * 100

    def compute_tone_score(self, expected: str, actual: str) -> float:
        """Score tone accuracy.

        Mandarin has 4 tones + 1 neutral. This is the hardest aspect
        for Arabic speakers who don't use lexical tones. Correct tone
        identification is crucial for meaning.
        """
        expected_tones = _get_tones(expected)
        actual_tones = _get_tones(actual)

        if not expected_tones:
            return 0.0

        # Pad shorter list with 0 (no-tone marker that won't match valid tones)
        max_len = max(len(expected_tones), len(actual_tones))
        expected_padded = expected_tones + [0] * (max_len - len(expected_tones))
        actual_padded = actual_tones + [0] * (max_len - len(actual_tones))

        if MINDSPORE_AVAILABLE:
            t_expected = Tensor(np.array(expected_padded, dtype=np.int32))
            t_actual = Tensor(np.array(actual_padded, dtype=np.int32))
            matches = ops.Equal()(t_expected, t_actual)
            accuracy = float(matches.astype(ms.float32).mean().asnumpy().item())
        else:
            matches = sum(1 for e, a in zip(expected_padded, actual_padded) if e == a)
            accuracy = matches / max_len

        return accuracy * 100

    def compute_score(self, expected: str, actual: str) -> float:
        """Compute overall pronunciation score (0-100).

        Weighted combination:
          - Character accuracy: 40%
          - Pinyin similarity: 35%
          - Tone accuracy: 25%
        """
        char_score = self.compute_character_score(expected, actual)
        pinyin_score = self.compute_pinyin_score(expected, actual)
        tone_score = self.compute_tone_score(expected, actual)

        total = (
            WEIGHT_CHAR * char_score
            + WEIGHT_PINYIN * pinyin_score
            + WEIGHT_TONE * tone_score
        )

        return total
