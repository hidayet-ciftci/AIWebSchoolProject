const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const { generateReply } = require("../services/llmService");

const router = express.Router();

// POST /chat
// Body: { "message": "string" }
// Response: { "reply": "string" }
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message : "";

    if (!message.trim()) {
      return res.status(400).json({ message: "message alanı zorunludur." });
    }

    // req.user JWT içinden geliyor (id, role vs.)
    // İstersek ileride DB'den profile çekip bağlama ekleyebiliriz.
    const userCtx = {
      role: req.user?.role,
    };

    const reply = await generateReply({ message, user: userCtx });
    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

