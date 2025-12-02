const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController"); // Controller'ı çağır
const upload = require("../middlewares/upload"); // Multer'ı çağır

// Sadece yolu gösterir, işi yapmaz
router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
