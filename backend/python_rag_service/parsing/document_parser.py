import hashlib
import re
from pathlib import Path

import docx2txt
import fitz  # PyMuPDF

from ..errors import ApiError


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


# Heuristic: a block is a section heading if it is short and looks like a title
_HEADING_RE = re.compile(
    r"^(\d+[\.\)]\s+.{2,80}|[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ0-9 \-]{2,59}|\#{1,4}\s+.{2,80})$"
)


def _looks_like_heading(text: str) -> bool:
    stripped = text.strip()
    if not stripped or len(stripped) > 120:
        return False
    return bool(_HEADING_RE.match(stripped))


def _parse_pdf_blocks(buffer: bytes) -> tuple[list[dict], int]:
    """
    Parse PDF and return structured blocks with page and section metadata.

    Returns
    -------
    blocks : list[{text, page, section}]
    page_count : int
    """
    doc = fitz.open(stream=buffer, filetype="pdf")
    page_count = len(doc)
    blocks: list[dict] = []
    current_section = ""

    for page_num, page in enumerate(doc, start=1):
        raw_blocks = page.get_text("blocks")
        for block in raw_blocks:
            # block tuple: (x0, y0, x1, y1, text, block_no, block_type)
            if block[6] != 0:  # skip image blocks
                continue
            block_text = normalize_text(block[4])
            if not block_text:
                continue

            if _looks_like_heading(block_text):
                current_section = block_text.strip()

            blocks.append(
                {
                    "text": block_text,
                    "page": page_num,
                    "section": current_section,
                }
            )

    doc.close()
    return blocks, page_count


def _parse_docx_blocks(buffer: bytes, path: Path) -> list[dict]:
    """
    Parse DOCX and return blocks with section metadata extracted from headings.
    docx2txt gives us a flat text; we split by paragraph and detect headings.
    """
    raw_text = docx2txt.process(str(path)) or ""
    normalized = normalize_text(raw_text)

    blocks: list[dict] = []
    current_section = ""

    for para in normalized.split("\n\n"):
        para = para.strip()
        if not para:
            continue

        if _looks_like_heading(para):
            current_section = para
            # Include heading text as its own block so it's part of retrieval
        blocks.append({"text": para, "page": None, "section": current_section})

    return blocks


def extract_document_text(file_path: str, mime_type: str = ""):
    path = Path(file_path)
    buffer = path.read_bytes()
    extension = path.suffix.lower()

    blocks: list[dict] = []
    page_count: int | None = None

    if mime_type == "application/pdf" or extension == ".pdf":
        blocks, page_count = _parse_pdf_blocks(buffer)
    elif mime_type in {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    } or extension in {".docx", ".doc"}:
        blocks = _parse_docx_blocks(buffer, path)
    elif mime_type.startswith("text/") or extension == ".txt":
        raw_text = buffer.decode("utf-8", errors="ignore")
        normalized = normalize_text(raw_text)
        # Treat each paragraph as a block (no page info for plain text)
        for para in normalized.split("\n\n"):
            para = para.strip()
            if para:
                blocks.append({"text": para, "page": None, "section": ""})
    else:
        raise ApiError("Unsupported file type for RAG. Use PDF, DOCX or TXT.", 415)

    if not blocks:
        raise ApiError("No readable text extracted from file.", 422)

    # Build flat text for hash and legacy compatibility
    full_text = "\n\n".join(b["text"] for b in blocks)
    digest = hashlib.sha256(buffer).hexdigest()

    return {
        "text": full_text,
        "blocks": blocks,
        "pageCount": page_count,
        "hash": digest,
        "sizeBytes": len(buffer),
    }
