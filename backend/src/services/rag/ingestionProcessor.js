const Course = require("../../models/Course");
const { embedTexts } = require("../llmService");
const { extractDocumentText } = require("./documentParser");
const { splitTextIntoChunks } = require("./textChunker");
const {
  upsertDocumentChunks,
  deleteMaterialChunks,
} = require("./chromaService");

async function updateMaterialState(courseId, materialId, fields) {
  const setObject = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [`materials.$.${key}`, value]),
  );

  await Course.updateOne(
    { _id: courseId, "materials._id": materialId },
    { $set: setObject },
  );
}

async function markMaterialFailed(courseId, materialId, errorMessage) {
  await updateMaterialState(courseId, materialId, {
    status: "failed",
    indexingError: errorMessage,
  });
}

async function processIngestionData(jobData) {
  const { courseId, materialId, filePath, fileName, mimeType } = jobData;

  await updateMaterialState(courseId, materialId, {
    status: "processing",
    indexingError: "",
  });

  const { text, hash } = await extractDocumentText(filePath, mimeType);

  const duplicateMaterial = await Course.findOne({
    _id: courseId,
    materials: {
      $elemMatch: {
        _id: { $ne: materialId },
        hash,
        status: "ready",
      },
    },
  }).select("_id");

  if (duplicateMaterial) {
    await updateMaterialState(courseId, materialId, {
      status: "ready",
      hash,
      mimeType,
      textExtractedAt: new Date(),
      chunksCount: 0,
      indexingError:
        "Aynı içerik bu ders için daha önce işlendiği için tekrar indekslenmedi.",
    });

    return { skipped: true, reason: "duplicate" };
  }

  const chunks = splitTextIntoChunks(text, {
    chunkSize: Number(process.env.RAG_CHUNK_SIZE || 1000),
    overlap: Number(process.env.RAG_CHUNK_OVERLAP || 200),
  });

  if (!chunks.length) {
    throw new Error("Dosya anlamlı chunk'lara ayrılamadı.");
  }

  const embeddings = await embedTexts(chunks.map((chunk) => chunk.text));
  const ids = chunks.map((chunk) => `${materialId}-${chunk.chunkIndex}`);
  const metadatas = chunks.map((chunk) => ({
    courseId: String(courseId),
    materialId: String(materialId),
    fileName,
    page: null,
    chunkIndex: chunk.chunkIndex,
    createdAt: new Date().toISOString(),
  }));

  await deleteMaterialChunks({ materialId: String(materialId) });
  await upsertDocumentChunks({
    ids,
    documents: chunks.map((chunk) => chunk.text),
    embeddings,
    metadatas,
  });

  await updateMaterialState(courseId, materialId, {
    status: "ready",
    hash,
    mimeType,
    textExtractedAt: new Date(),
    chunksCount: chunks.length,
    indexingError: "",
  });

  return {
    chunksIndexed: chunks.length,
  };
}

module.exports = {
  updateMaterialState,
  markMaterialFailed,
  processIngestionData,
};
