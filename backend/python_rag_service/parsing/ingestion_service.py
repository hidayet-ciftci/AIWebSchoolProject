from datetime import datetime, timezone

from bson import ObjectId

from ..config import RAG_CHUNK_OVERLAP_SENTENCES, RAG_CHUNK_SIZE
from ..db import get_course_collection
from .document_parser import extract_document_text
from ..retrieval.embedding_service import embed_passages
from ..errors import ApiError
from ..retrieval.qdrant_service import delete_material_chunks, ensure_collection, upsert_chunks
from .text_chunker import split_text_into_chunks


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
    course_id = str(job_data.get("courseId") or "")
    material_id = str(job_data.get("materialId") or "")
    file_path = str(job_data.get("filePath") or "")
    file_name = str(job_data.get("fileName") or "")
    mime_type = str(job_data.get("mimeType") or "")

    if not all([course_id, material_id, file_path]):
        raise ApiError("Ingestion payload is missing required fields.", 400)

    update_material_state(
        course_id,
        material_id,
        {
            "status": "processing",
            "indexingError": "",
        },
    )

    parsed = extract_document_text(file_path, mime_type)
    text = parsed["text"]
    file_hash = parsed["hash"]

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

    chunks = split_text_into_chunks(
        text=text,
        blocks=parsed.get("blocks"),
        max_chunk_size=RAG_CHUNK_SIZE,
        overlap_sentences=RAG_CHUNK_OVERLAP_SENTENCES,
    )
    if not chunks:
        raise ApiError("Document cannot be split into meaningful chunks.", 422)

    embeddings = embed_passages([chunk["text"] for chunk in chunks])

    # Build Qdrant point dicts
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

    delete_material_chunks(material_id)
    upsert_chunks(points)

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

    return {"chunksIndexed": len(chunks)}
