const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { generateReply } = require("../services/llmService");
const { getRagContext } = require("../services/rag/ragService");
const { streamPythonReply } = require("../services/pythonRagClient");

const router = express.Router();

// ── Non-streaming (JSON) ────────────────────────────────────────────────────
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const courseId =
      typeof req.body?.courseId === "string" ? req.body.courseId.trim() : "";

    if (!message) {
      return res.status(400).json({ message: "message alanı zorunludur." });
    }

    if (message.length > 2000) {
      return res.status(413).json({
        message: "Mesaj çok uzun. En fazla 2000 karakter gönderebilirsiniz.",
      });
    }

    const userCtx = {
      id: req.user?.id,
      role: req.user?.role,
    };

    const ragContext = await getRagContext({
      message,
      courseId,
      user: userCtx,
    });

    const reply = await generateReply({
      message,
      user: userCtx,
      courseName: ragContext?.course?.name,
      contextChunks: ragContext?.chunks || [],
    });

    res.json({
      reply,
      rag: {
        used: ragContext.useRag,
        reason: ragContext.reason,
        sourceCount: ragContext.chunks.length,
        sources: [
          ...new Set(
            (ragContext.chunks || [])
              .map((c) => c.metadata?.fileName)
              .filter(Boolean),
          ),
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── Streaming (SSE) ─────────────────────────────────────────────────────────
router.post("/stream", verifyToken, async (req, res, next) => {
  try {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const courseId =
      typeof req.body?.courseId === "string" ? req.body.courseId.trim() : "";

    if (!message) {
      return res.status(400).json({ message: "message alanı zorunludur." });
    }

    if (message.length > 2000) {
      return res.status(413).json({
        message: "Mesaj çok uzun. En fazla 2000 karakter gönderebilirsiniz.",
      });
    }

    const userCtx = {
      id: req.user?.id,
      role: req.user?.role,
    };

    // Retrieve context first (non-streaming)
    const ragContext = await getRagContext({
      message,
      courseId,
      user: userCtx,
    });

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send RAG metadata as the first event before tokens
    const ragMeta = {
      used: ragContext.useRag,
      reason: ragContext.reason,
      sourceCount: ragContext.chunks.length,
      sources: [
        ...new Set(
          (ragContext.chunks || [])
            .map((c) => c.metadata?.fileName)
            .filter(Boolean),
        ),
      ],
    };
    res.write(`data: [META] ${JSON.stringify(ragMeta)}\n\n`);

    // Abort SSE connection if client disconnects early
    const cleanup = () => res.end();
    req.on("close", cleanup);

    await streamPythonReply(
      {
        message,
        user: userCtx,
        contextChunks: ragContext?.chunks || [],
        courseName: ragContext?.course?.name || "",
      },
      res,
    );

    req.off("close", cleanup);
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`data: [ERROR] ${error.message || "Unexpected error"}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
