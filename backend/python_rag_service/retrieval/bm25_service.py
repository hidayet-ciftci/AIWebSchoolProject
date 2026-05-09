"""
BM25 keyword retrieval service.

Uses rank_bm25 (BM25Okapi) for exact keyword matching.
Complements semantic search by catching keyword-heavy queries
that embedding models might miss (e.g., specific course codes,
terminology, proper nouns in Turkish).

Turkish-aware tokenizer:
- Lowercases preserving ğ, ü, ş, ı, ö, ç
- Strips punctuation
- Splits on whitespace
"""

from __future__ import annotations

import re
import string

from ..config import BM25_B, BM25_K1


# ---------------------------------------------------------------------------
# Tokenizer
# ---------------------------------------------------------------------------

# Characters to strip from tokens (Turkish-safe — does not remove ğüşıöç)
_PUNCT_STRIP = re.compile(r"[^\w\sğüşıöçĞÜŞİÖÇ]", re.UNICODE)


def tokenize(text: str) -> list[str]:
    """Lowercase + strip punctuation + split on whitespace."""
    lowered = text.lower()
    cleaned = _PUNCT_STRIP.sub(" ", lowered)
    return [tok for tok in cleaned.split() if tok]


# ---------------------------------------------------------------------------
# BM25 index
# ---------------------------------------------------------------------------

def build_index(corpus: list[str]):
    """
    Build a BM25Okapi index from a list of text strings.
    Returns the (index, tokenized_corpus) tuple.
    """
    try:
        from rank_bm25 import BM25Okapi
    except ImportError as exc:
        raise ImportError(
            "rank_bm25 is not installed. Run: pip install rank-bm25"
        ) from exc

    tokenized = [tokenize(doc) for doc in corpus]
    index = BM25Okapi(tokenized, k1=BM25_K1, b=BM25_B)
    return index, tokenized


def get_scores(query: str, corpus: list[str]) -> list[float]:
    """
    Score each document in `corpus` against `query` using BM25.
    Returns a list of float scores aligned with `corpus`.
    """
    if not corpus:
        return []

    index, _ = build_index(corpus)
    query_tokens = tokenize(query)
    if not query_tokens:
        return [0.0] * len(corpus)

    scores = index.get_scores(query_tokens)
    return [float(s) for s in scores]


# ---------------------------------------------------------------------------
# Score normalization helper
# ---------------------------------------------------------------------------

def normalize_scores(scores: list[float]) -> list[float]:
    """Min-max normalize scores to [0, 1]."""
    if not scores:
        return []
    min_s = min(scores)
    max_s = max(scores)
    span = max_s - min_s
    if span == 0:
        return [1.0 if s > 0 else 0.0 for s in scores]
    return [(s - min_s) / span for s in scores]
