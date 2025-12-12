const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middlewares/verifyToken");

router.get("/", async (req, res, next) => {
  try {
    // Tüm kullanıcıları bul ama şifrelerini getirme
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get("/profile", verifyToken, async (req, res, next) => {
  try {
    const profile = await User.findById(req.user.id).select("-password");
    if (!profile) return res.status(404).json({ message: "user not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.get("/teacher", async (req, res, next) => {
  try {
    const users = await User.find({ role: "teacher" }).select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get("/student", async (req, res, next) => {
  try {
    const users = await User.find({ role: "student" }).select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
