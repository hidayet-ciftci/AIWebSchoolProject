from bson import ObjectId

from .chroma_service import query_relevant_chunks
from .config import RAG_MAX_DISTANCE, RAG_TOP_K
from .db import get_course_collection
from .errors import ApiError
from .ollama_service import embed_texts


def _to_object_id(raw_id: str, field_name: str = "id") -> ObjectId:
    try:
        return ObjectId(raw_id)
    except Exception as exc:  # pragma: no cover
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
    is_student = role == "student" and any(str(student_id) == user_id for student_id in course.get("students", []))

    if not is_admin and not is_teacher and not is_student:
        raise ApiError("No permission to access this course materials.", 403)

    return course


def get_rag_context(message: str, course_id: str | None, user: dict | None):
    if not course_id:
        return {
            "useRag": False,
            "reason": "no-course-id",
            "chunks": [],
        }

    course = assert_course_access(course_id, user)

    try:
        embeddings = embed_texts([message])
        query_embedding = embeddings[0] if embeddings else None

        if not query_embedding:
            return {
                "useRag": False,
                "reason": "empty-query-embedding",
                "chunks": [],
                "course": {"name": course.get("name") or ""},
            }

        results = query_relevant_chunks(
            embedding=query_embedding,
            course_id=str(course_id),
            top_k=max(RAG_TOP_K, 1),
        )

        if not results:
            return {
                "useRag": False,
                "reason": "no-results",
                "chunks": [],
                "course": {"name": course.get("name") or ""},
            }

        relevant = []
        for item in results:
            distance = item.get("distance")
            if not isinstance(distance, (int, float)) or float(distance) <= RAG_MAX_DISTANCE:
                relevant.append(item)

        if not relevant:
            return {
                "useRag": False,
                "reason": "low-similarity",
                "chunks": [],
                "course": {"name": course.get("name") or ""},
            }

        chunks = [
            {
                "text": item.get("document"),
                "distance": item.get("distance"),
                "metadata": item.get("metadata") or {},
            }
            for item in relevant[: max(RAG_TOP_K, 1)]
        ]

        return {
            "useRag": True,
            "reason": "ok",
            "course": {"name": course.get("name") or ""},
            "chunks": chunks,
        }
    except ApiError:
        raise
    except Exception:
        return {
            "useRag": False,
            "reason": "rag-unavailable",
            "chunks": [],
            "course": {"name": course.get("name") or ""},
        }
