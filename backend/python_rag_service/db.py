from urllib.parse import urlparse

from pymongo import MongoClient

from .config import MONGO_COURSE_COLLECTION, MONGO_DB_NAME, MONGO_URI
from .errors import ApiError


_mongo_client: MongoClient | None = None


def _resolve_db_name() -> str:
    if MONGO_DB_NAME:
        return MONGO_DB_NAME
    parsed = urlparse(MONGO_URI)
    path_name = (parsed.path or "").lstrip("/")
    if path_name:
        return path_name
    return "test"


def get_mongo_client() -> MongoClient:
    global _mongo_client
    if _mongo_client is not None:
        return _mongo_client
    if not MONGO_URI:
        raise ApiError("MONGO_URI is required for python rag service.", 500)
    _mongo_client = MongoClient(MONGO_URI)
    return _mongo_client


def get_course_collection():
    client = get_mongo_client()
    db = client[_resolve_db_name()]
    return db[MONGO_COURSE_COLLECTION]
