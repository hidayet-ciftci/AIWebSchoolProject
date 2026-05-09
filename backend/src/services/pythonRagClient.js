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
  // Ingestion can take much longer than chat requests (embedding large documents).
  // Use a dedicated higher timeout: 5 minutes.
  const ingestTimeoutMs = toPositiveNumber(
    process.env.PY_RAG_INGEST_TIMEOUT_MS,
    300_000,
  );
  return callPythonRag("/api/rag/ingest", jobData, ingestTimeoutMs);
}

async function deleteMaterialVectors(materialId) {
  return callPythonRag("/api/rag/delete-material", { materialId });
}

/**
 * Open a streaming SSE connection to the Python /api/llm/stream endpoint.
 *
 * The function fetches the Python SSE stream and pipes each `data: …` line
 * to the Express SSE response. It resolves when the upstream sends [DONE]
 * or closes, and rejects on errors.
 *
 * @param {Object} params
 * @param {string} params.message
 * @param {Object} [params.user]
 * @param {Array}  [params.contextChunks]
 * @param {string} [params.courseName]
 * @param {import('http').ServerResponse} res  - Express SSE response (already has headers set)
 */
async function streamPythonReply(
  { message, user, contextChunks, courseName },
  res,
) {
  const streamTimeoutMs = toPositiveNumber(
    process.env.PY_RAG_TIMEOUT_MS,
    120_000,
  );
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), streamTimeoutMs);

  try {
    const response = await fetch(`${PY_RAG_SERVICE_URL}/api/llm/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PY_RAG_SHARED_SECRET
          ? { "x-rag-secret": PY_RAG_SHARED_SECRET }
          : {}),
      },
      body: JSON.stringify({ message, user, contextChunks, courseName }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let msg = `Python RAG stream failed with ${response.status}`;
      try {
        msg = JSON.parse(text)?.message || msg;
      } catch {}
      const err = new Error(msg);
      err.statusCode = response.status;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        // Per SSE spec: strip exactly one leading space after "data:" — preserve the rest
        const raw = trimmed.slice(5);
        const data = raw.startsWith(" ") ? raw.slice(1) : raw;
        if (data === "[DONE]") {
          res.write("data: [DONE]\n\n");
          return;
        }
        res.write(`data: ${data}\n\n`);
      }
    }

    // Flush any remaining buffer
    if (buffer.trim().startsWith("data:")) {
      const raw = buffer.trim().slice(5);
      const data = raw.startsWith(" ") ? raw.slice(1) : raw;
      if (data && data !== "[DONE]") res.write(`data: ${data}\n\n`);
    }
    res.write("data: [DONE]\n\n");
  } catch (error) {
    if (error?.name === "AbortError") {
      res.write("data: [ERROR] Stream timeout\n\n");
      return;
    }
    const message = String(error?.message || error);
    if (
      message.includes("ECONNREFUSED") ||
      message.includes("fetch failed") ||
      message.includes("Failed to fetch")
    ) {
      res.write("data: [ERROR] Python RAG service is unreachable\n\n");
      return;
    }
    res.write(`data: [ERROR] ${message}\n\n`);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  callPythonRag,
  getPythonRagContext,
  generatePythonReply,
  ingestMaterial,
  deleteMaterialVectors,
  streamPythonReply,
};
