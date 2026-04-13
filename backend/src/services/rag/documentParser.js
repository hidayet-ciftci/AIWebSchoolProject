const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const pdfParseModule = require("pdf-parse");
const mammoth = require("mammoth");

async function parsePdfBuffer(buffer) {
  if (typeof pdfParseModule === "function") {
    return pdfParseModule(buffer);
  }

  if (typeof pdfParseModule?.PDFParse === "function") {
    const parser = new pdfParseModule.PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return {
        text: result?.text || "",
        numpages: result?.total || result?.pages?.length || null,
      };
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy().catch(() => {});
      }
    }
  }

  throw new Error("pdf-parse modülü beklenen API biçimini sağlamıyor.");
}

function normalizeText(text = "") {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractDocumentText(filePath, mimeType = "") {
  const buffer = await fs.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();

  let text = "";
  let pageCount = null;

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parsed = await parsePdfBuffer(buffer);
    text = parsed?.text || "";
    pageCount = parsed?.numpages || null;
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    extension === ".docx" ||
    extension === ".doc"
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    text = parsed?.value || "";
  } else if (mimeType.startsWith("text/") || extension === ".txt") {
    text = buffer.toString("utf8");
  } else {
    const err = new Error(
      "Bu dosya türü RAG için henüz desteklenmiyor. Şimdilik PDF, DOCX ve TXT kullanın.",
    );
    err.statusCode = 415;
    throw err;
  }

  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    const err = new Error("Dosyadan okunabilir metin çıkarılamadı.");
    err.statusCode = 422;
    throw err;
  }

  return {
    text: normalizedText,
    pageCount,
    hash: crypto.createHash("sha256").update(buffer).digest("hex"),
    sizeBytes: buffer.length,
  };
}

module.exports = {
  extractDocumentText,
  normalizeText,
};
