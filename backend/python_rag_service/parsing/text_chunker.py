"""
Semantic recursive text chunker.

Strategy (three levels, top-down):
  1. Section boundaries  — headings detected by heuristics
  2. Paragraph boundaries — blank lines (\n\n)
  3. Sentence boundaries  — NLTK punkt tokenizer (Turkish-aware)

Sentences are merged greedily until `max_chunk_size` is reached.
Overlap is applied at the sentence level (last N sentences carried over).

Chunk metadata:
  {chunkIndex, text, section, page}

`page` is passed in from `document_parser` via the `blocks` parameter.
If flat text is given (no blocks), page defaults to None and section is
detected from the text itself.
"""

from __future__ import annotations

import re

from ..config import RAG_CHUNK_OVERLAP_SENTENCES, RAG_CHUNK_SIZE


# ---------------------------------------------------------------------------
# Sentence tokenizer (NLTK with graceful fallback)
# ---------------------------------------------------------------------------

def _tokenize_sentences(text: str) -> list[str]:
    """Split text into sentences using NLTK punkt, falling back to regex."""
    try:
        import nltk  # type: ignore

        try:
            tokenizer = nltk.data.load("tokenizers/punkt_tab/turkish.pickle")
        except Exception:
            try:
                tokenizer = nltk.data.load("tokenizers/punkt/turkish.pickle")
            except Exception:
                tokenizer = None

        if tokenizer:
            return tokenizer.tokenize(text)

        # punkt_tab Turkish not available — use English model (works fine for
        # Turkish sentence boundaries which also end with . ! ?)
        return nltk.sent_tokenize(text)
    except ImportError:
        pass

    # Regex fallback — split on . ! ? followed by whitespace
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


# ---------------------------------------------------------------------------
# Section heading detection
# ---------------------------------------------------------------------------

_HEADING_RE = re.compile(
    r"""
    ^(
        \d+[\.\)]\s+.{3,60}     # "1. Giriş" or "1) Introduction"
        | [A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ0-9 \-]{2,59}  # ALL-CAPS line
        | \#{1,4}\s+.{2,60}     # Markdown heading
        | [IVXLC]+\.\s+.{2,60}  # Roman numeral heading
    )$
    """,
    re.VERBOSE | re.MULTILINE,
)


def _detect_section(line: str) -> bool:
    stripped = line.strip()
    if not stripped or len(stripped) > 120:
        return False
    return bool(_HEADING_RE.match(stripped))


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _merge_sentences_into_chunks(
    sentences: list[str],
    section: str,
    page: int | None,
    max_size: int,
    overlap_n: int,
) -> list[dict]:
    """Greedy sentence merge into chunks of at most `max_size` chars."""
    if not sentences:
        return []

    result: list[dict] = []
    current: list[str] = []
    current_len = 0

    def flush():
        text = " ".join(current).strip()
        if text:
            result.append({"text": text, "section": section, "page": page})

    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue

        addition = (1 if current else 0) + len(sent)
        if current_len + addition > max_size and current:
            flush()
            # carry-over overlap sentences
            carry = current[-overlap_n:] if overlap_n > 0 else []
            current = carry[:]
            current_len = sum(len(s) + 1 for s in current)

        current.append(sent)
        current_len += len(sent) + 1

    flush()
    return result


# ---------------------------------------------------------------------------
# Public API — accepts structured blocks or plain text
# ---------------------------------------------------------------------------

def split_text_into_chunks(
    text: str | None = None,
    blocks: list[dict] | None = None,
    max_chunk_size: int | None = None,
    overlap_sentences: int | None = None,
) -> list[dict]:
    """
    Split text into semantic chunks.

    Parameters
    ----------
    text:
        Plain text string (used when no `blocks` are supplied).
    blocks:
        List of {text, page, section} dicts from document_parser.
        When supplied, `text` is ignored.
    max_chunk_size:
        Maximum characters per chunk (default: RAG_CHUNK_SIZE).
    overlap_sentences:
        Number of sentences to carry over for context continuity
        (default: RAG_CHUNK_OVERLAP_SENTENCES).

    Returns
    -------
    List of {chunkIndex, text, section, page} dicts.
    """
    max_size = max_chunk_size or RAG_CHUNK_SIZE
    overlap_n = overlap_sentences if overlap_sentences is not None else RAG_CHUNK_OVERLAP_SENTENCES

    raw_chunks: list[dict] = []

    if blocks:
        # Process each block, grouping by section
        for block in blocks:
            block_text = str(block.get("text") or "").strip()
            if not block_text:
                continue
            page = block.get("page")
            section = str(block.get("section") or "")

            sentences = _tokenize_sentences(block_text)
            raw_chunks.extend(_merge_sentences_into_chunks(sentences, section, page, max_size, overlap_n))
    else:
        # Plain text — split by heading/paragraph first
        source = str(text or "").strip()
        if not source:
            return []

        lines = source.split("\n")
        current_section = ""
        current_para_lines: list[str] = []

        def flush_para():
            para_text = " ".join(current_para_lines).strip()
            if para_text:
                sentences = _tokenize_sentences(para_text)
                raw_chunks.extend(_merge_sentences_into_chunks(sentences, current_section, None, max_size, overlap_n))

        for line in lines:
            if _detect_section(line):
                flush_para()
                current_para_lines = []
                current_section = line.strip()
                continue

            if not line.strip():
                flush_para()
                current_para_lines = []
            else:
                current_para_lines.append(line.strip())

        flush_para()

    # Remove empty results and assign chunkIndex
    final: list[dict] = []
    for idx, chunk in enumerate(raw_chunks):
        text_val = chunk.get("text", "").strip()
        if text_val:
            final.append(
                {
                    "chunkIndex": idx,
                    "text": text_val,
                    "section": chunk.get("section", ""),
                    "page": chunk.get("page"),
                }
            )

    # Re-index to be sequential
    for idx, chunk in enumerate(final):
        chunk["chunkIndex"] = idx

    return final
