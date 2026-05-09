"""
CrossEncoder reranker service.

Model: cross-encoder/ms-marco-MiniLM-L-6-v2
- Scores (query, passage) pairs directly
- Much more accurate than bi-encoder similarity alone
- Singleton — loaded once on first use
- GPU auto-detection
"""

from __future__ import annotations

import logging

from ..config import RAG_FINAL_K, RERANK_THRESHOLD, RERANKER_MODEL
from ..errors import ApiError

logger = logging.getLogger(__name__)

_reranker = None


def _get_reranker():
    global _reranker
    if _reranker is not None:
        return _reranker

    try:
        from sentence_transformers import CrossEncoder
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading reranker model '%s' on device '%s' …", RERANKER_MODEL, device)
        _reranker = CrossEncoder(RERANKER_MODEL, device=device, max_length=512)
        logger.info("Reranker model loaded.")
    except ImportError as exc:
        raise ApiError(
            "sentence-transformers is not installed. Run: pip install sentence-transformers",
            500,
        ) from exc
    except Exception as exc:
        raise ApiError(f"Failed to load reranker model '{RERANKER_MODEL}': {exc}", 500) from exc

    return _reranker


def rerank(query: str, candidates: list[dict]) -> list[dict]:
    """
    Rerank `candidates` with a CrossEncoder against `query`.

    Each candidate dict must have a 'text' key.
    Returns at most RAG_FINAL_K candidates with score >= RERANK_THRESHOLD,
    sorted by descending reranker score. Each result gets a 'rerankerScore' key.
    """
    if not candidates:
        return []

    reranker = _get_reranker()

    pairs = [(query, str(c.get("text", ""))) for c in candidates]

    try:
        scores = reranker.predict(pairs, show_progress_bar=False)
    except Exception as exc:
        raise ApiError(f"Reranking failed: {exc}", 502) from exc

    scored = []
    for chunk, score in zip(candidates, scores):
        float_score = float(score)
        if float_score >= RERANK_THRESHOLD:
            enriched = dict(chunk)
            enriched["rerankerScore"] = float_score
            scored.append(enriched)

    scored.sort(key=lambda x: x["rerankerScore"], reverse=True)
    return scored[: RAG_FINAL_K]
