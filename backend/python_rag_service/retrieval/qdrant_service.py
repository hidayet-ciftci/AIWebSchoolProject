"""
Qdrant vector database service.

Manages a single collection `course_materials` with:
- Cosine similarity distance
- HNSW index for fast approximate nearest-neighbour search
- Payload filtering by courseId and materialId
"""

from __future__ import annotations

import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from ..config import EMBED_DIMENSION, QDRANT_COLLECTION, QDRANT_URL
from ..errors import ApiError

# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------

_client: QdrantClient | None = None


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        try:
            _client = QdrantClient(url=QDRANT_URL, timeout=30)
        except Exception as exc:
            raise ApiError(f"Cannot connect to Qdrant at {QDRANT_URL}.", 503) from exc
    return _client


# ---------------------------------------------------------------------------
# Collection bootstrap
# ---------------------------------------------------------------------------

def ensure_collection() -> None:
    """Create the collection if it does not exist yet."""
    client = _get_client()
    existing = {c.name for c in client.get_collections().collections}
    if QDRANT_COLLECTION in existing:
        return

    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=qmodels.VectorParams(
            size=EMBED_DIMENSION,
            distance=qmodels.Distance.COSINE,
        ),
        hnsw_config=qmodels.HnswConfigDiff(
            m=16,
            ef_construct=200,
            full_scan_threshold=10_000,
        ),
        optimizers_config=qmodels.OptimizersConfigDiff(
            indexing_threshold=20_000,
        ),
    )

    # Payload indexes for fast filtering
    client.create_payload_index(
        collection_name=QDRANT_COLLECTION,
        field_name="courseId",
        field_schema=qmodels.PayloadSchemaType.KEYWORD,
    )
    client.create_payload_index(
        collection_name=QDRANT_COLLECTION,
        field_name="materialId",
        field_schema=qmodels.PayloadSchemaType.KEYWORD,
    )


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------

def query_chunks(
    embedding: list[float],
    course_id: str,
    top_k: int = 25,
    material_id: str | None = None,
) -> list[dict]:
    """
    Return up to `top_k` chunks for a given course, ordered by cosine similarity.

    Each result dict:
        {text, score, courseId, materialId, fileName, section, page, chunkIndex}
    """
    client = _get_client()

    must_conditions: list[qmodels.FieldCondition] = [
        qmodels.FieldCondition(
            key="courseId",
            match=qmodels.MatchValue(value=course_id),
        )
    ]
    if material_id:
        must_conditions.append(
            qmodels.FieldCondition(
                key="materialId",
                match=qmodels.MatchValue(value=material_id),
            )
        )

    try:
        response = client.query_points(
            collection_name=QDRANT_COLLECTION,
            query=embedding,
            query_filter=qmodels.Filter(must=must_conditions),
            limit=top_k,
            with_payload=True,
            with_vectors=False,
        )
        results = response.points
    except Exception as exc:
        raise ApiError("Qdrant search failed.", 502) from exc

    chunks = []
    for hit in results:
        payload = hit.payload or {}
        chunks.append(
            {
                "text": payload.get("text", ""),
                "score": hit.score,
                "courseId": payload.get("courseId", ""),
                "materialId": payload.get("materialId", ""),
                "fileName": payload.get("fileName", ""),
                "section": payload.get("section", ""),
                "page": payload.get("page"),
                "chunkIndex": payload.get("chunkIndex", 0),
            }
        )

    return chunks


# ---------------------------------------------------------------------------
# Upsert
# ---------------------------------------------------------------------------

def upsert_chunks(points: list[dict]) -> None:
    """
    Upsert a list of points into the collection.

    Each point dict must contain:
        id (str), vector (list[float]), payload (dict)
    """
    client = _get_client()

    qdrant_points = [
        qmodels.PointStruct(
            id=_to_qdrant_id(p["id"]),
            vector=p["vector"],
            payload=p["payload"],
        )
        for p in points
    ]

    try:
        client.upsert(
            collection_name=QDRANT_COLLECTION,
            points=qdrant_points,
            wait=True,
        )
    except Exception as exc:
        raise ApiError("Qdrant upsert failed.", 502) from exc


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

def delete_material_chunks(material_id: str) -> None:
    """Delete all vectors belonging to a given materialId."""
    client = _get_client()
    # If the collection doesn't exist yet there is nothing to delete
    existing = {c.name for c in client.get_collections().collections}
    if QDRANT_COLLECTION not in existing:
        return
    try:
        client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="materialId",
                            match=qmodels.MatchValue(value=material_id),
                        )
                    ]
                )
            ),
            wait=True,
        )
    except Exception as exc:
        raise ApiError("Qdrant delete failed.", 502) from exc


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_qdrant_id(raw_id: str) -> str:
    """Convert an arbitrary string ID to a UUID v5 (Qdrant requires UUID or uint64)."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, raw_id))
