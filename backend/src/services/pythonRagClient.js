const PY_RAG_SERVICE_URL =
  process.env.PY_RAG_SERVICE_URL || "http://127.0.0.1:8001";
const PY_RAG_SHARED_SECRET = process.env.PY_RAG_SHARED_SECRET || "";

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const PY_RAG_TIMEOUT_MS = toPositiveNumber(
  process.env.PY_RAG_TIMEOUT_MS,
  120_000,
);

async function callPythonRag(path, payload, timeoutMs = PY_RAG_TIMEOUT_MS) {
  if (typeof fetch !== "function") {
    const err = new Error("Global fetch is unavailable. Use Node.js 18+.");
    err.statusCode = 500;
    throw err;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${PY_RAG_SERVICE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PY_RAG_SHARED_SECRET
          ? { "x-rag-secret": PY_RAG_SHARED_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const err = new Error(
        data?.message || `Python RAG request failed with ${response.status}`,
      );
      err.statusCode = response.status;
      if (data?.code) {
        err.code = data.code;
      }
      throw err;
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const seconds = Math.round(timeoutMs / 1000);
      const err = new Error(
        `Python RAG service timeout after ${seconds}s. Service may be down or busy.`,
      );
      err.statusCode = 504;
      throw err;
    }

    if (error?.statusCode) {
      throw error;
    }

    const message = String(error?.message || error);
    if (
      message.includes("ECONNREFUSED") ||
      message.includes("fetch failed") ||
      message.includes("Failed to fetch")
    ) {
      const err = new Error(
        "Python RAG service is unreachable. Start it and retry.",
      );
      err.statusCode = 503;
      throw err;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getPythonRagContext({ message, courseId, user }) {
  return callPythonRag("/api/rag/context", {
    message,
    courseId,
    user,
  });
}

async function generatePythonReply({
  message,
  user,
  contextChunks,
  courseName,
}) {
  const result = await callPythonRag("/api/llm/generate", {
    message,
    user,
    contextChunks,
    courseName,
  });
  return result?.reply || "";
}

async function ingestMaterial(jobData) {
  return callPythonRag("/api/rag/ingest", jobData);
}

async function deleteMaterialVectors(materialId) {
  return callPythonRag("/api/rag/delete-material", { materialId });
}

module.exports = {
  callPythonRag,
  getPythonRagContext,
  generatePythonReply,
  ingestMaterial,
  deleteMaterialVectors,
};
