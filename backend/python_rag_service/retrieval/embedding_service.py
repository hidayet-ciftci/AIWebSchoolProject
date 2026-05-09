"""
Embedding service using sentence-transformers.

Model: intfloat/multilingual-e5-base (768 dimensions)
- Multilingual, Turkish-aware
- E5 prefix strategy: "query: " for retrieval queries, "passage: " for documents
- GPU auto-detection via torch.cuda
- Singleton model loading (loaded once on first use)
- Simple functools.lru_cache for single-text queries
"""

from __future__ import annotations

import functools
import logging

from ..config import EMBED_BATCH_SIZE, EMBED_MODEL
from ..errors import ApiError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton model
# ---------------------------------------------------------------------------

_model = None


def _get_model():
    global _model
    if _model is not None:
        return _model

    try:
        from sentence_transformers import SentenceTransformer
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading embedding model '%s' on device '%s' …", EMBED_MODEL, device)
        _model = SentenceTransformer(EMBED_MODEL, device=device)
        logger.info("Embedding model loaded. Vector dim: %d", _model.get_sentence_embedding_dimension())
    except ImportError as exc:
        raise ApiError(
            "sentence-transformers is not installed. Run: pip install sentence-transformers",
            500,
        ) from exc
    except Exception as exc:
        raise ApiError(f"Failed to load embedding model '{EMBED_MODEL}': {exc}", 500) from exc

    return _model


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def embed_query(text: str) -> list[float]:
    """
    Embed a single retrieval query.
    Uses "query: " prefix as required by intfloat/e5 models.
    Results are cached with lru_cache for repeated identical queries.
    """
    return _embed_query_cached(text.strip())


def embed_passages(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of document passages in batches.
    Uses "passage: " prefix as required by intfloat/e5 models.
    """
    if not texts:
        return []

    cleaned = [t.strip() for t in texts if t.strip()]
    if not cleaned:
        return []

    prefixed = [f"passage: {t}" for t in cleaned]
    model = _get_model()

    try:
        all_vectors: list[list[float]] = []
        for batch_start in range(0, len(prefixed), EMBED_BATCH_SIZE):
            batch = prefixed[batch_start : batch_start + EMBED_BATCH_SIZE]
            vectors = model.encode(
                batch,
                normalize_embeddings=True,
                show_progress_bar=False,
                convert_to_numpy=True,
            )
            all_vectors.extend(v.tolist() for v in vectors)
        return all_vectors
    except Exception as exc:
        raise ApiError(f"Embedding generation failed: {exc}", 502) from exc


# ---------------------------------------------------------------------------
# Internal cached helper
# ---------------------------------------------------------------------------

@functools.lru_cache(maxsize=256)
def _embed_query_cached(text: str) -> list[float]:
    prefixed = f"query: {text}"
    model = _get_model()
    try:
        vector = model.encode(
            prefixed,
            normalize_embeddings=True,
            show_progress_bar=False,
            convert_to_numpy=True,
        )
        return vector.tolist()
    except Exception as exc:
        raise ApiError(f"Query embedding failed: {exc}", 502) from exc
