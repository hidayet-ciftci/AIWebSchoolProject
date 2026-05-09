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

# Ollama — LLM generation only (embedding moved to sentence-transformers)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_GENERATE_TIMEOUT_MS = int(_to_positive_number(os.getenv("OLLAMA_GENERATE_TIMEOUT_MS"), 45000))
OLLAMA_RAG_TIMEOUT_MS = int(_to_positive_number(os.getenv("OLLAMA_RAG_TIMEOUT_MS"), 120000))
OLLAMA_NUM_PREDICT = int(_to_positive_number(os.getenv("OLLAMA_NUM_PREDICT"), 600))

# Qdrant vector database
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "course_materials")

# Embedding model (sentence-transformers)
EMBED_MODEL = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-base")
EMBED_BATCH_SIZE = int(_to_positive_number(os.getenv("EMBED_BATCH_SIZE"), 32))
EMBED_DIMENSION = 768  # intfloat/multilingual-e5-base output dimension

# Reranker model (cross-encoder)
RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

# BM25 parameters
BM25_K1 = _to_positive_number(os.getenv("BM25_K1"), 1.5)
BM25_B = _to_positive_number(os.getenv("BM25_B"), 0.75)

# Hybrid retrieval weights (alpha * semantic + (1-alpha) * BM25)
HYBRID_ALPHA = _to_positive_number(os.getenv("HYBRID_ALPHA"), 0.6)

# Retrieval pipeline
RAG_CANDIDATE_K = int(_to_positive_number(os.getenv("RAG_CANDIDATE_K"), 25))
RAG_FINAL_K = int(_to_positive_number(os.getenv("RAG_FINAL_K"), 5))
RERANK_THRESHOLD = float(os.getenv("RERANK_THRESHOLD", "0.0"))

# Chunking
RAG_CHUNK_SIZE = int(_to_positive_number(os.getenv("RAG_CHUNK_SIZE"), 600))
RAG_CHUNK_OVERLAP_SENTENCES = int(_to_positive_number(os.getenv("RAG_CHUNK_OVERLAP_SENTENCES"), 2))

# Context assembly
RAG_CONTEXT_SOURCES = int(_to_positive_number(os.getenv("RAG_CONTEXT_SOURCES"), 5))
RAG_CONTEXT_CHAR_LIMIT = int(_to_positive_number(os.getenv("RAG_CONTEXT_CHAR_LIMIT"), 6000))

PY_RAG_SHARED_SECRET = os.getenv("PY_RAG_SHARED_SECRET", "")
