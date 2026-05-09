"""
Prompt builder — separated from ollama_service for clarity.

Builds structured Turkish-language prompts for the educational AI assistant.
Rules:
  - Use ONLY the provided material context (no hallucination)
  - If answer not found: say exactly "Bu materyaller içinde buna dair bilgi bulamadım."
  - Turkish, academic language
  - Short and precise answers
  - Duplicate chunk deduplication by text hash
  - Context trimmed to RAG_CONTEXT_CHAR_LIMIT chars
"""

from __future__ import annotations

import hashlib

from ..config import RAG_CONTEXT_CHAR_LIMIT, RAG_CONTEXT_SOURCES


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

_SYSTEM_WITH_CONTEXT = (
    "Sen bir eğitim asistanısın. "
    "YALNIZCA aşağıda verilen MATERYAL BAĞLAMI bölümündeki bilgileri kullanarak yanıt ver. "
    "Yanıtlarını Türkçe, akademik ve anlaşılır bir dille yaz. "
    "Eğer sorunun cevabı materyallerde açıkça yer almıyorsa, kesinlikle şunu yaz: "
    "'Bu materyaller içinde buna dair bilgi bulamadım.' "
    "Materyalde olmayan bilgileri kesinlikle tahmin etme veya uydurma. "
    "Kısa, net ve konuya odaklı yanıtlar ver."
)

_SYSTEM_WITHOUT_CONTEXT = (
    "Sen bir eğitim asistanısın. "
    "Soruları Türkçe, akademik ve eğitici bir şekilde yanıtla. "
    "Gerektiğinde örnekler ver. Kısa ve net ol."
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_system_prompt(has_context: bool) -> str:
    return _SYSTEM_WITH_CONTEXT if has_context else _SYSTEM_WITHOUT_CONTEXT


def build_context_block(chunks: list[dict]) -> str:
    """
    Deduplicate chunks by text hash, trim to char limit,
    and format as a labeled context block.
    """
    if not chunks:
        return ""

    seen_hashes: set[str] = set()
    deduped: list[dict] = []
    for chunk in chunks:
        text = str(chunk.get("text", "")).strip()
        if not text:
            continue
        h = hashlib.md5(text.encode("utf-8")).hexdigest()
        if h not in seen_hashes:
            seen_hashes.add(h)
            deduped.append(chunk)

    # Limit by source count and total chars
    limited: list[dict] = []
    remaining_chars = max(RAG_CONTEXT_CHAR_LIMIT, 1000)
    for chunk in deduped[: max(RAG_CONTEXT_SOURCES, 1)]:
        text = str(chunk.get("text", "")).strip()
        if not text or remaining_chars <= 0:
            break
        trimmed = text[:remaining_chars]
        entry = dict(chunk)
        entry["text"] = trimmed
        limited.append(entry)
        remaining_chars -= len(trimmed)

    if not limited:
        return ""

    lines = ["MATERYAL BAĞLAMI:"]
    for idx, chunk in enumerate(limited):
        metadata = chunk.get("metadata") or {}
        file_name = (
            chunk.get("fileName")
            or metadata.get("fileName")
            or f"Kaynak-{idx + 1}"
        )
        section = chunk.get("section") or metadata.get("section") or ""
        page = chunk.get("page") or metadata.get("page")

        label_parts = [f"[Kaynak {idx + 1}] {file_name}"]
        if section:
            label_parts.append(f"Bölüm: {section}")
        if page is not None:
            label_parts.append(f"Sayfa: {page}")

        lines.append(", ".join(label_parts))
        lines.append(chunk["text"])
        lines.append("")

    return "\n".join(lines).strip()


def build_full_prompt(
    message: str,
    user: dict | None = None,
    chunks: list[dict] | None = None,
    course_name: str = "",
) -> str:
    """Assemble the full prompt string to send to Ollama."""
    user = user or {}
    chunks = chunks or []

    context_block = build_context_block(chunks)
    has_context = bool(context_block)

    system_prompt = build_system_prompt(has_context)

    role = user.get("role", "")
    role_labels = {
        "admin": "Yönetici (admin)",
        "teacher": "Öğretmen",
        "student": "Öğrenci",
    }
    role_info = f"Kullanıcı rolü: {role_labels.get(role, 'Bilinmiyor')}."

    name_parts = [n for n in [user.get("name"), user.get("surname")] if n]
    name_info = f"Kullanıcı adı: {' '.join(name_parts)}." if name_parts else ""

    parts: list[str] = [
        f"SİSTEM: {system_prompt}",
        f"BAĞLAM: {role_info} {name_info}".strip(),
    ]

    if course_name:
        parts.append(f"DERS: {course_name}")

    if context_block:
        parts.append(context_block)

    parts.append(f"KULLANICI: {message}")
    parts.append("ASISTAN:")

    return "\n\n".join(parts)
