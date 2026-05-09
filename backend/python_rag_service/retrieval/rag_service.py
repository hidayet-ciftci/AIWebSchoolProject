"""
Two-stage hybrid RAG retrieval pipeline.

Stage 1 — Candidate retrieval (parallelised scoring):
  1a. Semantic search: embed query → Qdrant top-RAG_CANDIDATE_K
  1b. BM25 keyword scoring on the same candidate corpus
  Score fusion: norm_semantic * HYBRID_ALPHA + norm_bm25 * (1 - HYBRID_ALPHA)

Stage 2 — Reranking:
  CrossEncoder reranker on fused candidates → top-RAG_FINAL_K

Access control is enforced before retrieval (same as before).
"""

from __future__ import annotations

from bson import ObjectId

from .bm25_service import get_scores as bm25_get_scores
from .bm25_service import normalize_scores
from ..config import HYBRID_ALPHA, RAG_CANDIDATE_K, RAG_FINAL_K
from ..db import get_course_collection
from .embedding_service import embed_query
from ..errors import ApiError
from .qdrant_service import query_chunks
from .reranker_service import rerank


# ---------------------------------------------------------------------------
# Access control
# ---------------------------------------------------------------------------

def _to_object_id(raw_id: str, field_name: str = "id") -> ObjectId:
    try:
        return ObjectId(raw_id)
    except Exception as exc:
        raise ApiError(f"Invalid {field_name}.", 400) from exc


def assert_course_access(course_id: str, user: dict | None):
    user = user or {}
    collection = get_course_collection()
    course = collection.find_one(
        {"_id": _to_object_id(course_id, "courseId")},
        {"name": 1, "teacher": 1, "students": 1},
    )

    if not course:
        raise ApiError("Course not found.", 404)

    user_id = str(user.get("id") or "")
    role = str(user.get("role") or "")

    is_admin = role == "admin"
    is_teacher = role == "teacher" and str(course.get("teacher") or "") == user_id
    is_student = role == "student" and any(
        str(sid) == user_id for sid in course.get("students", [])
    )

    if not is_admin and not is_teacher and not is_student:
        raise ApiError("No permission to access this course materials.", 403)

    return course


# ---------------------------------------------------------------------------
# Score fusion
# ---------------------------------------------------------------------------

def _fuse_scores(
    candidates: list[dict],
    semantic_scores: list[float],
    bm25_scores: list[float],
    alpha: float,
) -> list[dict]:
    """Combine normalised semantic and BM25 scores into a single ranking."""
    norm_sem = normalize_scores(semantic_scores)
    norm_bm25 = normalize_scores(bm25_scores)

    fused = []
    for chunk, sem, kw in zip(candidates, norm_sem, norm_bm25):
        enriched = dict(chunk)
        enriched["fusedScore"] = alpha * sem + (1.0 - alpha) * kw
        fused.append(enriched)

    fused.sort(key=lambda x: x["fusedScore"], reverse=True)
    return fused


# ---------------------------------------------------------------------------
# Main retrieval entry-point
# ---------------------------------------------------------------------------

def get_rag_context(message: str, course_id: str | None, user: dict | None):
    if not course_id:
        return {
            "useRag": False,
            "reason": "no-course-id",
            "chunks": [],
        }

    course = assert_course_access(course_id, user)
    course_name = course.get("name") or ""

    # ── Stage 1a: semantic retrieval ─────────────────────────────────────
    try:
        query_embedding = embed_query(message)
    except ApiError:
        raise
    except Exception as exc:
        return {
            "useRag": False,
            "reason": "embedding-error",
            "chunks": [],
            "course": {"name": course_name},
        }

    try:
        candidates = query_chunks(
            embedding=query_embedding,
            course_id=str(course_id),
            top_k=max(RAG_CANDIDATE_K, 1),
        )
    except ApiError:
        raise
    except Exception:
        return {
            "useRag": False,
            "reason": "qdrant-error",
            "chunks": [],
            "course": {"name": course_name},
        }

    if not candidates:
        return {
            "useRag": False,
            "reason": "no-results",
            "chunks": [],
            "course": {"name": course_name},
        }

    # ── Stage 1b: BM25 keyword scoring ───────────────────────────────────
    corpus = [c["text"] for c in candidates]
    bm25_scores = bm25_get_scores(message, corpus)

    # Semantic scores come from Qdrant (cosine similarity, already 0-1)
    semantic_scores = [c["score"] for c in candidates]

    # ── Score fusion ─────────────────────────────────────────────────────
    fused = _fuse_scores(candidates, semantic_scores, bm25_scores, HYBRID_ALPHA)

    # ── Stage 2: CrossEncoder reranking ──────────────────────────────────
    try:
        reranked = rerank(message, fused)
    except ApiError:
        # Reranker unavailable — fall back to fused ranking
        reranked = fused[:RAG_FINAL_K]

    if not reranked:
        return {
            "useRag": False,
            "reason": "low-similarity",
            "chunks": [],
            "course": {"name": course_name},
        }

    # ── Format output chunks ──────────────────────────────────────────────
    chunks = [
        {
            "text": c["text"],
            "score": c.get("rerankerScore") or c.get("fusedScore") or 0.0,
            "metadata": {
                "fileName": c.get("fileName", ""),
                "section": c.get("section", ""),
                "page": c.get("page"),
                "materialId": c.get("materialId", ""),
                "chunkIndex": c.get("chunkIndex", 0),
            },
        }
        for c in reranked
    ]

    return {
        "useRag": True,
        "reason": "ok",
        "course": {"name": course_name},
        "chunks": chunks,
    }
