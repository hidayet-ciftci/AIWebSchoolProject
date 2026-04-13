const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text:latest";

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const GENERATE_TIMEOUT_MS = toPositiveNumber(
  process.env.OLLAMA_GENERATE_TIMEOUT_MS,
  45_000,
);
const RAG_GENERATE_TIMEOUT_MS = toPositiveNumber(
  process.env.OLLAMA_RAG_TIMEOUT_MS,
  120_000,
);
const EMBED_TIMEOUT_MS = toPositiveNumber(
  process.env.OLLAMA_EMBED_TIMEOUT_MS,
  60_000,
);
const MAX_CONTEXT_SOURCES = Math.max(
  1,
  Math.floor(toPositiveNumber(process.env.RAG_CONTEXT_SOURCES, 3)),
);
const MAX_CONTEXT_CHARS = Math.max(
  1000,
  Math.floor(toPositiveNumber(process.env.RAG_CONTEXT_CHAR_LIMIT, 3200)),
);
const MAX_RESPONSE_TOKENS = Math.max(
  64,
  Math.floor(toPositiveNumber(process.env.OLLAMA_NUM_PREDICT, 220)),
);

let cachedModel = null;

function isEmbeddingModel(modelName = "") {
  const normalized = modelName.toLowerCase().trim();
  return (
    normalized.includes("embed") ||
    normalized.startsWith("nomic-embed") ||
    normalized.includes("bge-") ||
    normalized.includes("e5-")
  );
}

function pickGenerativeModel(modelNames = []) {
  return modelNames.find((name) => !isEmbeddingModel(name));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}, timeoutMs = GENERATE_TIMEOUT_MS) {
  if (typeof fetch !== "function") {
    const err = new Error(
      "Bu Node.js sürümünde global fetch yok. Node 18+ kullanın.",
    );
    err.statusCode = 500;
    throw err;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message =
        (data && (data.error || data.message)) ||
        `Ollama isteği başarısız: ${res.status}`;
      // Ollama bazen model runner'ı bellek/uyumluluk yüzünden düşürdüğünde bu hatayı döner.
      if (
        typeof message === "string" &&
        message.toLowerCase().includes("runner process has terminated")
      ) {
        const err = new Error(
          "Ollama model süreci kapandı. Bu genellikle bellek (RAM/VRAM) yetersizliği veya model/runner sorunu nedeniyle olur. Daha küçük bir model deneyin veya Ollama'yı yeniden başlatıp tekrar deneyin.",
        );
        err.statusCode = 503;
        err.code = "OLLAMA_RUNNER_TERMINATED";
        throw err;
      }

      const err = new Error(message);
      err.statusCode = 502;
      throw err;
    }

    return data;
  } catch (e) {
    if (e?.name === "AbortError") {
      const seconds = Math.round(timeoutMs / 1000);
      const err = new Error(
        `Ollama yanıt vermedi (${seconds}sn timeout). Ollama çalışıyor mu kontrol edin.`,
      );
      err.statusCode = 504;
      throw err;
    }
    // Bağlantı hataları (Ollama kapalı / erişilemiyor)
    const msg = String(e?.message || e);
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("fetch failed") ||
      msg.includes("Failed to fetch")
    ) {
      const err = new Error(
        "Ollama'ya bağlanılamadı. `http://localhost:11434` erişilebilir mi?",
      );
      err.statusCode = 503;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

async function resolveModel() {
  if (cachedModel) return cachedModel;

  try {
    const tags = await fetchJson(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const models = Array.isArray(tags?.models) ? tags.models : [];
    const names = models
      .map((m) => m?.name)
      .filter((n) => typeof n === "string" && n.length > 0);

    const normalizedDefault = DEFAULT_MODEL.toLowerCase();
    const preferredModel = names.find((name) => {
      const normalizedName = name.toLowerCase();
      return (
        normalizedName === normalizedDefault ||
        normalizedName === `${normalizedDefault}:latest` ||
        normalizedName.split(":")[0] === normalizedDefault
      );
    });

    if (preferredModel && !isEmbeddingModel(preferredModel)) {
      cachedModel = preferredModel;
      return cachedModel;
    }

    const fallbackModel = pickGenerativeModel(names);
    if (fallbackModel) {
      cachedModel = fallbackModel;
      return cachedModel;
    }
  } catch (error) {
    if (error?.statusCode) {
      throw error;
    }
  }

  if (!isEmbeddingModel(DEFAULT_MODEL)) {
    cachedModel = DEFAULT_MODEL;
    return cachedModel;
  }

  const err = new Error(
    "Ollama'da generate destekli bir sohbet modeli bulunamadı. `llama3:latest` gibi bir model kurup `OLLAMA_MODEL` değişkenini ona ayarlayın.",
  );
  err.statusCode = 503;
  throw err;
}

function limitContextChunks(contextChunks = []) {
  if (!Array.isArray(contextChunks) || !contextChunks.length) {
    return [];
  }

  const limited = [];
  let remainingChars = MAX_CONTEXT_CHARS;

  for (const chunk of contextChunks.slice(0, MAX_CONTEXT_SOURCES)) {
    const rawText = typeof chunk?.text === "string" ? chunk.text.trim() : "";
    if (!rawText || remainingChars <= 0) {
      continue;
    }

    const trimmedText = rawText.slice(0, remainingChars).trim();
    if (!trimmedText) {
      continue;
    }

    limited.push({
      ...chunk,
      text: trimmedText,
    });

    remainingChars -= trimmedText.length;
  }

  return limited;
}

function buildPrompt({ message, user, contextChunks = [], courseName = "" }) {
  const limitedContextChunks = limitContextChunks(contextChunks);
  const hasContext = limitedContextChunks.length > 0;
  const systemPrompt = hasContext
    ? "Her zaman Türkçe cevap ver. Açıklayıcı ama kısa bir dil kullan. Sadece verilen materyal bağlamına göre cevap ver. Eğer cevap bağlam içinde yoksa tam olarak 'Bu materyaller içinde buna dair bilgi bulamadım.' de. Tahmin yürütme, uydurma bilgi verme ve bağlam dışına çıkma. Mümkünse en fazla 5-6 cümle kullan."
    : "Her zaman Türkçe cevap ver. Açıklayıcı ve öğretici bir dil kullan. Kısa, net ve uygulanabilir öneriler ver. Eğer kullanıcı eğitim/okul bağlamında soru soruyorsa örneklerle anlat. Yanıtında gereksiz İngilizce kullanma.";

  const roleInfo =
    user?.role === "admin"
      ? "Kullanıcı rolü: Yönetici (admin)."
      : user?.role === "teacher"
        ? "Kullanıcı rolü: Öğretmen."
        : user?.role === "student"
          ? "Kullanıcı rolü: Öğrenci."
          : "Kullanıcı rolü: Bilinmiyor.";

  const nameInfo =
    user?.name && user?.surname
      ? `Kullanıcı adı: ${user.name} ${user.surname}.`
      : user?.name
        ? `Kullanıcı adı: ${user.name}.`
        : "";

  const courseInfo = courseName ? `Ders adı: ${courseName}.` : "";
  const contextBlock = hasContext
    ? [
        "MATERYAL BAĞLAMI:",
        ...limitedContextChunks.map((chunk, index) => {
          const sourceName = chunk?.metadata?.fileName || `Kaynak-${index + 1}`;
          return `[Kaynak ${index + 1}] ${sourceName}\n${chunk.text}`;
        }),
      ].join("\n\n")
    : "";

  return [
    `SİSTEM: ${systemPrompt}`,
    `BAĞLAM: ${roleInfo} ${nameInfo}`.trim(),
    courseInfo ? `DERS: ${courseInfo}` : "",
    contextBlock,
    `KULLANICI: ${message}`,
    "ASİSTAN:",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function requestEmbeddings(cleanedTexts) {
  try {
    const data = await fetchJson(
      `${OLLAMA_BASE_URL}/api/embed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: cleanedTexts,
        }),
      },
      EMBED_TIMEOUT_MS,
    );

    if (Array.isArray(data?.embeddings) && data.embeddings.length > 0) {
      return data.embeddings;
    }
  } catch {
    // Bazı Ollama sürümleri /api/embed yerine legacy embeddings endpointi kullanır.
  }

  const embeddings = [];
  for (const text of cleanedTexts) {
    const data = await fetchJson(
      `${OLLAMA_BASE_URL}/api/embeddings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: EMBED_MODEL,
          prompt: text,
        }),
      },
      EMBED_TIMEOUT_MS,
    );

    const vector =
      data?.embedding ||
      (Array.isArray(data?.embeddings) ? data.embeddings[0] : null);

    if (!Array.isArray(vector)) {
      const err = new Error("Embedding modeli geçerli bir vektör döndürmedi.");
      err.statusCode = 502;
      throw err;
    }

    embeddings.push(vector);
  }

  return embeddings;
}

async function embedTexts(texts = []) {
  const cleanedTexts = texts
    .map((text) => (typeof text === "string" ? text.trim() : ""))
    .filter(Boolean);

  if (!cleanedTexts.length) {
    return [];
  }

  try {
    return await requestEmbeddings(cleanedTexts);
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (
      error?.code === "OLLAMA_RUNNER_TERMINATED" ||
      message.includes("runner process has terminated") ||
      message.includes("model süreci kapandı")
    ) {
      await sleep(750);
      return requestEmbeddings(cleanedTexts);
    }

    throw error;
  }
}

async function generateReply({
  message,
  user,
  contextChunks = [],
  courseName = "",
}) {
  const model = await resolveModel();
  const prompt = buildPrompt({ message, user, contextChunks, courseName });

  const timeoutMs = contextChunks.length
    ? Math.max(RAG_GENERATE_TIMEOUT_MS, GENERATE_TIMEOUT_MS)
    : GENERATE_TIMEOUT_MS;

  const payload = {
    model,
    prompt,
    stream: false,
    options: {
      temperature: 0.4,
      num_predict: MAX_RESPONSE_TOKENS,
    },
  };

  // Non-streaming basit kullanım
  // Not: Ollama bazen ilk istekte runner'ı düşürüp ikinci istekte toparlayabiliyor.
  // Bu yüzden "runner process has terminated" hatasında 1 kez retry yapıyoruz.
  let data;
  try {
    data = await fetchJson(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      timeoutMs,
    );
  } catch (e) {
    const msg = String(e?.message || e).toLowerCase();
    if (
      e?.code === "OLLAMA_RUNNER_TERMINATED" ||
      msg.includes("runner process has terminated") ||
      msg.includes("model süreci kapandı")
    ) {
      await sleep(750);
      data = await fetchJson(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        timeoutMs,
      );
    } else {
      throw e;
    }
  }

  const reply = (data?.response || "").trim();
  if (!reply) {
    const err = new Error("Modelden boş yanıt alındı.");
    err.statusCode = 502;
    throw err;
  }

  return reply;
}

module.exports = {
  embedTexts,
  generateReply,
};
