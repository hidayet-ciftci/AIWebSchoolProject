import hashlib
import io
from pathlib import Path

import docx2txt
from pypdf import PdfReader

from .errors import ApiError


def normalize_text(text: str = "") -> str:
    return (
        text.replace("\r", "")
        .replace("\t", " ")
        .replace("  ", " ")
        .replace("\n\n\n", "\n\n")
        .strip()
    )


def _parse_pdf_buffer(buffer: bytes) -> tuple[str, int | None]:
    reader = PdfReader(io.BytesIO(buffer))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages), len(reader.pages)


def extract_document_text(file_path: str, mime_type: str = ""):
    path = Path(file_path)
    buffer = path.read_bytes()
    extension = path.suffix.lower()

    text = ""
    page_count = None

    if mime_type == "application/pdf" or extension == ".pdf":
        text, page_count = _parse_pdf_buffer(buffer)
    elif mime_type in {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    } or extension in {".docx", ".doc"}:
        text = docx2txt.process(str(path)) or ""
    elif mime_type.startswith("text/") or extension == ".txt":
        text = buffer.decode("utf-8", errors="ignore")
    else:
        raise ApiError("Unsupported file type for RAG. Use PDF, DOCX or TXT.", 415)

    normalized_text = normalize_text(text)
    if not normalized_text:
        raise ApiError("No readable text extracted from file.", 422)

    digest = hashlib.sha256(buffer).hexdigest()
    return {
        "text": normalized_text,
        "pageCount": page_count,
        "hash": digest,
        "sizeBytes": len(buffer),
    }
