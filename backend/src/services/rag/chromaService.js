const { deleteMaterialVectors } = require("../pythonRagClient");

async function getCollection() {
  const err = new Error(
    "getCollection is moved to python rag service and is not available in Node.",
  );
  err.statusCode = 500;
  throw err;
}

async function upsertDocumentChunks() {
  const err = new Error(
    "upsertDocumentChunks is moved to python rag service and is not available in Node.",
  );
  err.statusCode = 500;
  throw err;
}

async function queryRelevantChunks() {
  const err = new Error(
    "queryRelevantChunks is moved to python rag service and is not available in Node.",
  );
  err.statusCode = 500;
  throw err;
}

async function deleteMaterialChunks({ materialId }) {
  await deleteMaterialVectors(materialId);
}

module.exports = {
  getCollection,
  queryRelevantChunks,
  upsertDocumentChunks,
  deleteMaterialChunks,
};
