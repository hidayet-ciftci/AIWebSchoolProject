const { ChromaClient } = require("chromadb");

const CHROMA_URL =
  process.env.CHROMA_URL ||
  `http://${process.env.CHROMA_HOST || "localhost"}:${process.env.CHROMA_PORT || "8000"}`;
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || "course_materials";

const parsedUrl = new URL(CHROMA_URL);
const noOpEmbeddingFunction = {
  generate: async () => {
    throw new Error(
      "Bu koleksiyon için embeddingler uygulama tarafından Ollama ile dışarıdan üretilmelidir.",
    );
  },
};

let chromaClient = null;
let collectionPromise = null;

function getChromaClient() {
  if (chromaClient) return chromaClient;

  chromaClient = new ChromaClient({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 8000),
    ssl: parsedUrl.protocol === "https:",
  });

  return chromaClient;
}

async function getCollection() {
  if (collectionPromise) return collectionPromise;

  const client = getChromaClient();
  collectionPromise = client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: noOpEmbeddingFunction,
    metadata: {
      "hnsw:space": "cosine",
    },
  });

  return collectionPromise;
}

async function upsertDocumentChunks({ ids, documents, embeddings, metadatas }) {
  const collection = await getCollection();

  if (typeof collection.upsert === "function") {
    await collection.upsert({ ids, documents, embeddings, metadatas });
    return;
  }

  try {
    await collection.delete({ ids });
  } catch {
    // IDs ilk kez ekleniyorsa silme hatası önemli değil.
  }

  await collection.add({ ids, documents, embeddings, metadatas });
}

async function queryRelevantChunks({ embedding, courseId, topK }) {
  const collection = await getCollection();
  const result = await collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    where: { courseId },
  });

  const ids = Array.isArray(result?.ids?.[0]) ? result.ids[0] : [];
  const documents = Array.isArray(result?.documents?.[0])
    ? result.documents[0]
    : [];
  const metadatas = Array.isArray(result?.metadatas?.[0])
    ? result.metadatas[0]
    : [];
  const distances = Array.isArray(result?.distances?.[0])
    ? result.distances[0]
    : [];

  return documents
    .map((document, index) => ({
      id: ids[index] || null,
      document,
      metadata: metadatas[index] || {},
      distance: typeof distances[index] === "number" ? distances[index] : null,
    }))
    .filter(
      (item) => typeof item.document === "string" && item.document.trim(),
    );
}

async function deleteMaterialChunks({ materialId }) {
  const collection = await getCollection();
  await collection.delete({
    where: { materialId },
  });
}

module.exports = {
  getCollection,
  queryRelevantChunks,
  upsertDocumentChunks,
  deleteMaterialChunks,
};
