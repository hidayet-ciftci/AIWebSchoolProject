function getTailOverlap(text, overlap) {
  if (!text || overlap <= 0) return "";
  return text.slice(Math.max(0, text.length - overlap)).trim();
}

function splitTextIntoChunks(text, options = {}) {
  const chunkSize = Number(
    options.chunkSize || process.env.RAG_CHUNK_SIZE || 1000,
  );
  const overlap = Number(
    options.overlap || process.env.RAG_CHUNK_OVERLAP || 200,
  );

  if (!text || !text.trim()) {
    return [];
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const candidate = currentChunk
      ? `${currentChunk}\n\n${paragraph}`
      : paragraph;

    if (candidate.length <= chunkSize) {
      currentChunk = candidate;
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
      const overlapText = getTailOverlap(currentChunk, overlap);
      currentChunk = overlapText ? `${overlapText}\n\n${paragraph}` : paragraph;
    } else {
      currentChunk = paragraph;
    }

    while (currentChunk.length > chunkSize) {
      const slice = currentChunk.slice(0, chunkSize).trim();
      if (slice) {
        chunks.push(slice);
      }
      currentChunk = currentChunk
        .slice(Math.max(0, chunkSize - overlap))
        .trim();
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.map((chunk, chunkIndex) => ({
    chunkIndex,
    text: chunk,
  }));
}

module.exports = {
  splitTextIntoChunks,
};
