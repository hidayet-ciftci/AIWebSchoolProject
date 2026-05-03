const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { generateReply } = require("../services/llmService");
const { getRagContext } = require("../services/rag/ragService");

const router = express.Router();

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

module.exports = router;
