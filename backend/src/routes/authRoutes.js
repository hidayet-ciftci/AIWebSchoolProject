const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const checkRole = require("../middlewares/checkRole");
const verifyToken = require("../middlewares/verifyToken");
const upload = require("../middlewares/upload");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/dashboard", verifyToken, async (req, res, next) => {
  try {
    res.json({ message: "dashboard accesed" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
