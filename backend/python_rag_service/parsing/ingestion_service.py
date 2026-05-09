import logging
import os
import time
from datetime import datetime, timezone

from bson import ObjectId

from ..config import RAG_CHUNK_OVERLAP_SENTENCES, RAG_CHUNK_SIZE
from ..db import get_course_collection
from .document_parser import extract_document_text
from ..retrieval.embedding_service import embed_passages
from ..errors import ApiError
from ..retrieval.qdrant_service import delete_material_chunks, ensure_collection, upsert_chunks
from .text_chunker import split_text_into_chunks

logger = logging.getLogger(__name__)


def _to_object_id(raw_id: str, field_name: str = "id") -> ObjectId:
    try:
        return ObjectId(raw_id)
    except Exception as exc:  # pragma: no cover
        raise ApiError(f"Invalid {field_name}.", 400) from exc


def _utc_now():
    return datetime.now(timezone.utc)


def update_material_state(course_id: str, material_id: str, fields: dict):
    collection = get_course_collection()
    set_fields = {f"materials.$.{key}": value for key, value in fields.items()}
    collection.update_one(
        {"_id": _to_object_id(course_id, "courseId"), "materials._id": _to_object_id(material_id, "materialId")},
        {"$set": set_fields},
    )


def mark_material_failed(course_id: str, material_id: str, error_message: str):
    update_material_state(
        course_id,
        material_id,
        {
            "status": "failed",
            "indexingError": error_message,
        },
    )


def process_ingestion_data(job_data: dict):
    t_total = time.perf_counter()
    timing: dict = {}

    course_id = str(job_data.get("courseId") or "")
    material_id = str(job_data.get("materialId") or "")
    file_path = str(job_data.get("filePath") or "")
    file_name = str(job_data.get("fileName") or "")
    mime_type = str(job_data.get("mimeType") or "")

    if not all([course_id, material_id, file_path]):
        raise ApiError("Ingestion payload is missing required fields.", 400)

    file_size_mb = round(os.path.getsize(file_path) / 1_048_576, 2) if os.path.exists(file_path) else 0
    logger.info("[INGEST] START file=%s size=%.2fMB", file_name, file_size_mb)

    update_material_state(
        course_id,
        material_id,
        {
            "status": "processing",
            "indexingError": "",
        },
    )

    # ── 1. Parse ─────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    parsed = extract_document_text(file_path, mime_type)
    timing["parse_sec"] = round(time.perf_counter() - t0, 3)
    text = parsed["text"]
    file_hash = parsed["hash"]
    timing["total_chars"] = len(text)
    logger.info("[INGEST] parse=%.2fs chars=%d", timing["parse_sec"], timing["total_chars"])

    collection = get_course_collection()
    duplicate = collection.find_one(
        {
            "_id": _to_object_id(course_id, "courseId"),
            "materials": {
                "$elemMatch": {
                    "_id": {"$ne": _to_object_id(material_id, "materialId")},
                    "hash": file_hash,
                    "status": "ready",
                }
            },
        },
        {"_id": 1},
    )

    if duplicate:
        update_material_state(
            course_id,
            material_id,
            {
                "status": "ready",
                "hash": file_hash,
                "mimeType": mime_type,
                "textExtractedAt": _utc_now(),
                "chunksCount": 0,
                "indexingError": "Duplicate content already indexed for this course.",
            },
        )
        return {"skipped": True, "reason": "duplicate"}

    # ── 2. Chunk ─────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    chunks = split_text_into_chunks(
        text=text,
        blocks=parsed.get("blocks"),
        max_chunk_size=RAG_CHUNK_SIZE,
        overlap_sentences=RAG_CHUNK_OVERLAP_SENTENCES,
    )
    timing["chunk_sec"] = round(time.perf_counter() - t0, 3)
    timing["chunk_count"] = len(chunks)
    if chunks:
        timing["avg_chunk_len"] = int(sum(len(c["text"]) for c in chunks) / len(chunks))
    logger.info("[INGEST] chunk=%.2fs count=%d avg_len=%d", timing["chunk_sec"], timing["chunk_count"], timing.get("avg_chunk_len", 0))

    if not chunks:
        raise ApiError("Document cannot be split into meaningful chunks.", 422)

    if timing["chunk_count"] > 1500:
        logger.warning("[INGEST] CHUNK_EXPLOSION: %d chunks — consider increasing RAG_CHUNK_SIZE", timing["chunk_count"])

    # ── 3. Embed ─────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    embeddings = embed_passages([chunk["text"] for chunk in chunks])
    timing["embed_sec"] = round(time.perf_counter() - t0, 3)
    timing["embed_cps"] = round(timing["chunk_count"] / max(timing["embed_sec"], 0.001), 1)
    logger.info("[INGEST] embed=%.2fs throughput=%.0f chunk/s", timing["embed_sec"], timing["embed_cps"])

    # ── 4. Qdrant upsert ────────────────────────────────────────────────
    ensure_collection()
    points = [
        {
            "id": f"{material_id}-{chunk['chunkIndex']}",
            "vector": embeddings[i],
            "payload": {
                "text": chunk["text"],
                "courseId": course_id,
                "materialId": material_id,
                "fileName": file_name,
                "section": chunk.get("section", ""),
                "page": chunk.get("page"),
                "chunkIndex": chunk["chunkIndex"],
                "createdAt": _utc_now().isoformat(),
            },
        }
        for i, chunk in enumerate(chunks)
    ]

    t0 = time.perf_counter()
    delete_material_chunks(material_id)
    timing["qdrant_delete_sec"] = round(time.perf_counter() - t0, 3)

    t0 = time.perf_counter()
    upsert_chunks(points)
    timing["qdrant_upsert_sec"] = round(time.perf_counter() - t0, 3)
    logger.info("[INGEST] qdrant delete=%.2fs upsert=%.2fs", timing["qdrant_delete_sec"], timing["qdrant_upsert_sec"])

    # ── 5. MongoDB güncelle ──────────────────────────────────────────────
    update_material_state(
        course_id,
        material_id,
        {
            "status": "ready",
            "hash": file_hash,
            "mimeType": mime_type,
            "textExtractedAt": _utc_now(),
            "chunksCount": len(chunks),
            "indexingError": "",
        },
    )

    timing["total_sec"] = round(time.perf_counter() - t_total, 3)
    logger.info(
        "[INGEST] DONE file=%s size=%.2fMB chunks=%d | parse=%.2fs chunk=%.2fs embed=%.2fs(%.0f c/s) qdrant=%.2fs | TOTAL=%.2fs",
        file_name, file_size_mb, timing["chunk_count"],
        timing["parse_sec"], timing["chunk_sec"],
        timing["embed_sec"], timing["embed_cps"],
        timing["qdrant_upsert_sec"], timing["total_sec"],
    )

    return {"chunksIndexed": len(chunks), "timing": timing}
