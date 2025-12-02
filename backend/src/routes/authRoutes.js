const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController"); // Controller'ı çağır
const checkRole = require("../middlewares/checkRole");
const verifyToken = require("../middlewares/verifyToken");
const upload = require("../middlewares/upload"); // Multer'ı çağır

// Sadece yolu gösterir, işi yapmaz
router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/profile", verifyToken, async (req, res, next) => {
  try {
    res.json({ message: "profile accesed" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
