import os
from pathlib import Path


def _load_dotenv_file() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


_load_dotenv_file()


def _to_positive_number(raw_value: str | None, fallback: float) -> float:
    try:
        parsed = float(raw_value) if raw_value is not None else fallback
    except (TypeError, ValueError):
        return fallback
    return parsed if parsed > 0 else fallback


MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "")
MONGO_COURSE_COLLECTION = os.getenv("MONGO_COURSE_COLLECTION", "courses")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")

CHROMA_URL = os.getenv("CHROMA_URL", "http://localhost:8000")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "course_materials")

RAG_TOP_K = int(_to_positive_number(os.getenv("RAG_TOP_K"), 4))
RAG_MAX_DISTANCE = _to_positive_number(os.getenv("RAG_MAX_DISTANCE"), 0.9)
RAG_CHUNK_SIZE = int(_to_positive_number(os.getenv("RAG_CHUNK_SIZE"), 1000))
RAG_CHUNK_OVERLAP = int(_to_positive_number(os.getenv("RAG_CHUNK_OVERLAP"), 200))
RAG_CONTEXT_SOURCES = int(_to_positive_number(os.getenv("RAG_CONTEXT_SOURCES"), 3))
RAG_CONTEXT_CHAR_LIMIT = int(_to_positive_number(os.getenv("RAG_CONTEXT_CHAR_LIMIT"), 3200))

OLLAMA_GENERATE_TIMEOUT_MS = int(_to_positive_number(os.getenv("OLLAMA_GENERATE_TIMEOUT_MS"), 45000))
OLLAMA_RAG_TIMEOUT_MS = int(_to_positive_number(os.getenv("OLLAMA_RAG_TIMEOUT_MS"), 120000))
OLLAMA_EMBED_TIMEOUT_MS = int(_to_positive_number(os.getenv("OLLAMA_EMBED_TIMEOUT_MS"), 60000))
OLLAMA_NUM_PREDICT = int(_to_positive_number(os.getenv("OLLAMA_NUM_PREDICT"), 220))

PY_RAG_SHARED_SECRET = os.getenv("PY_RAG_SHARED_SECRET", "")
