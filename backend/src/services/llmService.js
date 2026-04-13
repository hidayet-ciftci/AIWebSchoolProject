const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3";

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

async function fetchJson(url, options = {}, timeoutMs = 30_000) {
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
        throw err;
      }

      const err = new Error(message);
      err.statusCode = 502;
      throw err;
    }

    return data;
  } catch (e) {
    if (e?.name === "AbortError") {
      const err = new Error(
        "Ollama yanıt vermedi (timeout). Ollama çalışıyor mu kontrol edin.",
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

function buildPrompt({ message, user }) {
  const systemPrompt =
    "Her zaman Türkçe cevap ver. Açıklayıcı ve öğretici bir dil kullan. Kısa, net ve uygulanabilir öneriler ver. Eğer kullanıcı eğitim/okul bağlamında soru soruyorsa örneklerle anlat. Yanıtında gereksiz İngilizce kullanma.";

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

  return [
    `SİSTEM: ${systemPrompt}`,
    `BAĞLAM: ${roleInfo} ${nameInfo}`.trim(),
    `KULLANICI: ${message}`,
    "ASİSTAN:",
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateReply({ message, user }) {
  const model = await resolveModel();
  const prompt = buildPrompt({ message, user });

  const payload = {
    model,
    prompt,
    stream: false,
    options: {
      temperature: 0.7,
    },
  };

  // Non-streaming basit kullanım
  // Not: Ollama bazen ilk istekte runner'ı düşürüp ikinci istekte toparlayabiliyor.
  // Bu yüzden "runner process has terminated" hatasında 1 kez retry yapıyoruz.
  let data;
  try {
    data = await fetchJson(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = String(e?.message || e).toLowerCase();
    if (msg.includes("runner process has terminated")) {
      await sleep(750);
      data = await fetchJson(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
  generateReply,
};
