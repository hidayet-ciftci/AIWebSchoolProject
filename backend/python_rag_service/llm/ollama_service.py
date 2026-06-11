"""
Ollama LLM service — generation only.

Embedding has been moved to retrieval/embedding_service.py (sentence-transformers).
This module handles:
  - generate_reply()  — blocking JSON response
  - generate_stream() — async generator yielding tokens via SSE
  - _resolve_model()  — cached model name resolution
"""

import json
import time
from typing import AsyncGenerator

import httpx
import requests

from ..config import (
    OLLAMA_BASE_URL,
    OLLAMA_GENERATE_TIMEOUT_MS,
    OLLAMA_MODEL,
    OLLAMA_NUM_PREDICT,
    OLLAMA_RAG_TIMEOUT_MS,
)
from ..errors import ApiError, is_runner_terminated_message
from .prompt_builder import build_full_prompt


_cached_model: str | None = None
_cached_model_at: float = 0.0
_MODEL_CACHE_TTL: float = 300.0  # 5 minutes


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
    global _cached_model, _cached_model_at
    if _cached_model and (time.time() - _cached_model_at) < _MODEL_CACHE_TTL:
        return _cached_model

    try:
        tags = _fetch_json("/api/tags", "GET")
        models = tags.get("models", []) if isinstance(tags, dict) else []
        names = [
            entry.get("name")
            for entry in models
            if isinstance(entry, dict) and entry.get("name")
        ]

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
            _cached_model_at = time.time()
            return _cached_model

        if names:
            raise ApiError(
                f"Ollama model '{OLLAMA_MODEL}' is not available on the server.",
                503,
                code="OLLAMA_MODEL_NOT_FOUND",
            )

        fallback = next((name for name in names if not _is_embedding_model(name)), None)
        if fallback:
            _cached_model = fallback
            _cached_model_at = time.time()
            return _cached_model
    except ApiError as error:
        if error.code == "OLLAMA_MODEL_NOT_FOUND":
            raise
        pass

    if not _is_embedding_model(OLLAMA_MODEL):
        _cached_model = OLLAMA_MODEL
        _cached_model_at = time.time()
        return _cached_model

    raise ApiError("No generate-capable model is available in Ollama.", 503)


def _build_payload(model: str, prompt: str, stream: bool) -> dict:
    return {
        "model": model,
        "prompt": prompt,
        "stream": stream,
        "options": {
            "temperature": 0.3,
            "num_predict": max(OLLAMA_NUM_PREDICT, 64),
        },
    }


# ---------------------------------------------------------------------------
# Blocking generation
# ---------------------------------------------------------------------------

def generate_reply(
    message: str,
    user: dict | None = None,
    context_chunks: list[dict] | None = None,
    course_name: str = "",
) -> str:
    user = user or {}
    context_chunks = context_chunks or []
    prompt = build_full_prompt(
        message=message,
        user=user,
        chunks=context_chunks,
        course_name=course_name,
    )
    model = _resolve_model()

    timeout_ms = (
        max(OLLAMA_RAG_TIMEOUT_MS, OLLAMA_GENERATE_TIMEOUT_MS)
        if context_chunks
        else OLLAMA_GENERATE_TIMEOUT_MS
    )
    payload = _build_payload(model, prompt, stream=False)

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


# ---------------------------------------------------------------------------
# Streaming generation
# ---------------------------------------------------------------------------

async def generate_stream(
    message: str,
    user: dict | None = None,
    context_chunks: list[dict] | None = None,
    course_name: str = "",
) -> AsyncGenerator[str, None]:
    """
    Async generator that yields token strings from Ollama's streaming API.
    Ollama sends one JSON object per line when stream=true.
    Each yielded value is a raw token string (may be empty for the final done=true line).
    """
    user = user or {}
    context_chunks = context_chunks or []
    prompt = build_full_prompt(
        message=message,
        user=user,
        chunks=context_chunks,
        course_name=course_name,
    )
    model = _resolve_model()

    timeout_s = max(OLLAMA_RAG_TIMEOUT_MS, OLLAMA_GENERATE_TIMEOUT_MS) / 1000
    payload = _build_payload(model, prompt, stream=True)
    url = f"{OLLAMA_BASE_URL}/api/generate"

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(timeout_s)) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    try:
                        err_data = json.loads(body)
                        msg = err_data.get("error") or err_data.get("message") or "Ollama error"
                    except Exception:
                        msg = f"Ollama HTTP {response.status_code}"
                    raise ApiError(msg, 502)

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    token = obj.get("response", "")
                    if token:
                        yield token

                    if obj.get("done"):
                        return

    except httpx.TimeoutException as exc:
        raise ApiError(f"Ollama streaming timeout after {round(timeout_s)}s.", 504) from exc
    except httpx.RequestError as exc:
        raise ApiError("Cannot connect to Ollama for streaming.", 503) from exc
