import time

import requests

from .config import (
    OLLAMA_BASE_URL,
    OLLAMA_EMBED_MODEL,
    OLLAMA_EMBED_TIMEOUT_MS,
    OLLAMA_GENERATE_TIMEOUT_MS,
    OLLAMA_MODEL,
    OLLAMA_NUM_PREDICT,
    OLLAMA_RAG_TIMEOUT_MS,
    RAG_CONTEXT_CHAR_LIMIT,
    RAG_CONTEXT_SOURCES,
)
from .errors import ApiError, is_runner_terminated_message


_cached_model = None


def _is_embedding_model(model_name: str = "") -> bool:
    normalized = model_name.lower().strip()
    return (
        "embed" in normalized
        or normalized.startswith("nomic-embed")
        or "bge-" in normalized
        or "e5-" in normalized
    )


def _fetch_json(path: str, method: str = "GET", payload=None, timeout_ms: int = OLLAMA_GENERATE_TIMEOUT_MS):
    url = f"{OLLAMA_BASE_URL}{path}"
    try:
        response = requests.request(
            method,
            url,
            json=payload,
            timeout=max(timeout_ms / 1000, 1),
        )
    except requests.Timeout as exc:
        raise ApiError(f"Ollama timeout after {round(timeout_ms / 1000)}s.", 504) from exc
    except requests.RequestException as exc:
        raise ApiError("Cannot connect to Ollama.", 503) from exc

    data = None
    if response.text:
        try:
            data = response.json()
        except ValueError:
            data = None

    if not response.ok:
        msg = "Ollama request failed"
        if isinstance(data, dict):
            msg = str(data.get("error") or data.get("message") or msg)
        if is_runner_terminated_message(msg):
            raise ApiError("Ollama runner process terminated.", 503, code="OLLAMA_RUNNER_TERMINATED")
        raise ApiError(msg, 502)

    return data


def _resolve_model() -> str:
    global _cached_model
    if _cached_model:
        return _cached_model

    try:
        tags = _fetch_json("/api/tags", "GET")
        models = tags.get("models", []) if isinstance(tags, dict) else []
        names = [entry.get("name") for entry in models if isinstance(entry, dict) and entry.get("name")]

        normalized_default = OLLAMA_MODEL.lower()
        preferred = None
        for name in names:
            normalized = name.lower()
            if (
                normalized == normalized_default
                or normalized == f"{normalized_default}:latest"
                or normalized.split(":")[0] == normalized_default
            ) and not _is_embedding_model(name):
                preferred = name
                break

        if preferred:
            _cached_model = preferred
            return _cached_model

        fallback = next((name for name in names if not _is_embedding_model(name)), None)
        if fallback:
            _cached_model = fallback
            return _cached_model
    except ApiError:
        pass

    if not _is_embedding_model(OLLAMA_MODEL):
        _cached_model = OLLAMA_MODEL
        return _cached_model

    raise ApiError("No generate-capable model is available in Ollama.", 503)


def _limit_context_chunks(context_chunks: list[dict] | None):
    if not context_chunks:
        return []

    limited = []
    remaining = max(RAG_CONTEXT_CHAR_LIMIT, 1000)
    source_limit = max(RAG_CONTEXT_SOURCES, 1)

    for chunk in context_chunks[:source_limit]:
        raw_text = str(chunk.get("text", "")).strip()
        if not raw_text or remaining <= 0:
            continue
        trimmed = raw_text[:remaining].strip()
        if not trimmed:
            continue
        next_chunk = dict(chunk)
        next_chunk["text"] = trimmed
        limited.append(next_chunk)
        remaining -= len(trimmed)

    return limited


def build_prompt(message: str, user: dict | None = None, context_chunks: list[dict] | None = None, course_name: str = ""):
    user = user or {}
    context_chunks = _limit_context_chunks(context_chunks)
    has_context = len(context_chunks) > 0

    system_prompt = (
        "Always answer in Turkish. Use short explanatory language. "
        "Only answer using provided material context. "
        "If answer does not exist in context reply exactly: "
        "Bu materyaller icinde buna dair bilgi bulamadim. "
        "Do not hallucinate and keep response within 5-6 sentences."
        if has_context
        else "Always answer in Turkish. Use educational and practical explanations."
    )

    role = user.get("role")
    if role == "admin":
        role_info = "Kullanici rolu: Yönetici (admin)."
    elif role == "teacher":
        role_info = "Kullanici rolu: Ogretmen."
    elif role == "student":
        role_info = "Kullanici rolu: Ogrenci."
    else:
        role_info = "Kullanici rolu: Bilinmiyor."

    name_info = ""
    if user.get("name") and user.get("surname"):
        name_info = f"Kullanici adi: {user['name']} {user['surname']}."
    elif user.get("name"):
        name_info = f"Kullanici adi: {user['name']}."

    context_block = ""
    if has_context:
        chunks = ["MATERYAL BAGLAMI:"]
        for index, chunk in enumerate(context_chunks):
            file_name = chunk.get("metadata", {}).get("fileName") or f"Kaynak-{index + 1}"
            chunks.append(f"[Kaynak {index + 1}] {file_name}\n{chunk.get('text', '')}")
        context_block = "\n\n".join(chunks)

    parts = [
        f"SISTEM: {system_prompt}",
        f"BAGLAM: {role_info} {name_info}".strip(),
        f"DERS: Ders adi: {course_name}." if course_name else "",
        context_block,
        f"KULLANICI: {message}",
        "ASISTAN:",
    ]
    return "\n\n".join([part for part in parts if part])


def _request_embeddings(cleaned_texts: list[str]):
    try:
        data = _fetch_json(
            "/api/embed",
            "POST",
            payload={"model": OLLAMA_EMBED_MODEL, "input": cleaned_texts},
            timeout_ms=OLLAMA_EMBED_TIMEOUT_MS,
        )
        embeddings = data.get("embeddings") if isinstance(data, dict) else None
        if isinstance(embeddings, list) and embeddings:
            return embeddings
    except ApiError:
        pass

    embeddings = []
    for text in cleaned_texts:
        data = _fetch_json(
            "/api/embeddings",
            "POST",
            payload={"model": OLLAMA_EMBED_MODEL, "prompt": text},
            timeout_ms=OLLAMA_EMBED_TIMEOUT_MS,
        )
        vector = None
        if isinstance(data, dict):
            vector = data.get("embedding")
            if not vector and isinstance(data.get("embeddings"), list) and data["embeddings"]:
                vector = data["embeddings"][0]

        if not isinstance(vector, list):
            raise ApiError("Embedding model did not return a valid vector.", 502)
        embeddings.append(vector)

    return embeddings


def embed_texts(texts: list[str] | None = None):
    texts = texts or []
    cleaned = [str(text).strip() for text in texts if str(text).strip()]
    if not cleaned:
        return []

    try:
        return _request_embeddings(cleaned)
    except ApiError as error:
        if error.code == "OLLAMA_RUNNER_TERMINATED" or is_runner_terminated_message(error.message):
            time.sleep(0.75)
            return _request_embeddings(cleaned)
        raise


def generate_reply(message: str, user: dict | None = None, context_chunks: list[dict] | None = None, course_name: str = "") -> str:
    user = user or {}
    context_chunks = context_chunks or []
    prompt = build_prompt(message=message, user=user, context_chunks=context_chunks, course_name=course_name)
    model = _resolve_model()

    timeout_ms = max(OLLAMA_RAG_TIMEOUT_MS, OLLAMA_GENERATE_TIMEOUT_MS) if context_chunks else OLLAMA_GENERATE_TIMEOUT_MS
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.4,
            "num_predict": max(OLLAMA_NUM_PREDICT, 64),
        },
    }

    try:
        data = _fetch_json("/api/generate", "POST", payload=payload, timeout_ms=timeout_ms)
    except ApiError as error:
        if error.code == "OLLAMA_RUNNER_TERMINATED" or is_runner_terminated_message(error.message):
            time.sleep(0.75)
            data = _fetch_json("/api/generate", "POST", payload=payload, timeout_ms=timeout_ms)
        else:
            raise

    reply = ""
    if isinstance(data, dict):
        reply = str(data.get("response") or "").strip()
    if not reply:
        raise ApiError("Model returned an empty response.", 502)
    return reply
