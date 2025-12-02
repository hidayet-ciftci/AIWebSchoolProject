const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/list", async (req, res, next) => {
  try {
    // Tüm kullanıcıları bul ama şifrelerini getirme
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
