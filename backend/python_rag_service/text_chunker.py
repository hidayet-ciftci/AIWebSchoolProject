from .config import RAG_CHUNK_OVERLAP, RAG_CHUNK_SIZE


def get_tail_overlap(text: str, overlap: int) -> str:
    if not text or overlap <= 0:
        return ""
    return text[max(0, len(text) - overlap) :].strip()


def split_text_into_chunks(text: str, chunk_size: int | None = None, overlap: int | None = None):
    selected_chunk_size = chunk_size or RAG_CHUNK_SIZE
    selected_overlap = overlap if overlap is not None else RAG_CHUNK_OVERLAP

    if not text or not text.strip():
        return []

    paragraphs = [part.strip() for part in text.split("\n\n") if part.strip()]
    chunks: list[str] = []
    current_chunk = ""

    for paragraph in paragraphs:
        candidate = f"{current_chunk}\n\n{paragraph}" if current_chunk else paragraph
        if len(candidate) <= selected_chunk_size:
            current_chunk = candidate
            continue

        if current_chunk:
            chunks.append(current_chunk.strip())
            overlap_text = get_tail_overlap(current_chunk, selected_overlap)
            current_chunk = f"{overlap_text}\n\n{paragraph}" if overlap_text else paragraph
        else:
            current_chunk = paragraph

        while len(current_chunk) > selected_chunk_size:
            slice_text = current_chunk[:selected_chunk_size].strip()
            if slice_text:
                chunks.append(slice_text)
            current_chunk = current_chunk[max(0, selected_chunk_size - selected_overlap) :].strip()

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return [{"chunkIndex": index, "text": value} for index, value in enumerate(chunks)]
