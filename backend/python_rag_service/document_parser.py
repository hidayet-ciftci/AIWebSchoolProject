import hashlib
import re
from pathlib import Path

import docx2txt
import fitz  # PyMuPDF

from .errors import ApiError


def normalize_text(text: str = "") -> str:
    # Fix hyphenated line-breaks (e.g. "keli-\nme" → "kelime")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = text.replace("\r", "")
    text = text.replace("\t", " ")
    # Collapse runs of spaces
    text = re.sub(r" {2,}", " ", text)
    # Reduce 3+ consecutive newlines to two
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _parse_pdf_buffer(buffer: bytes) -> tuple[str, int | None]:
    doc = fitz.open(stream=buffer, filetype="pdf")
    page_count = len(doc)
    page_texts = []
    for page in doc:
        # Extract text at block level to preserve paragraph structure.
        # Blocks within a page are joined with a single newline;
        # pages are separated by a blank line so the chunker sees page
        # boundaries as paragraph boundaries without over-fragmenting.
        blocks = page.get_text("blocks")
        block_texts = []
        for block in blocks:
            # block tuple: (x0, y0, x1, y1, text, block_no, block_type)
            # block_type 0 = text, 1 = image
            if block[6] == 0:
                block_text = block[4].strip()
                if block_text:
                    block_texts.append(block_text)
        if block_texts:
            page_texts.append("\n".join(block_texts))
    doc.close()
    return "\n\n".join(page_texts), page_count


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
