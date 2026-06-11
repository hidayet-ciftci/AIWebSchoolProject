const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");

router.get("/", async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get("/profile", verifyToken, async (req, res, next) => {
  try {
    const profile = await User.findById(req.user.id).select("-password");
    if (!profile)
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
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

// Admin: update a user (no password updates here)
router.put("/:id", verifyToken, checkRole("admin"), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    // prevent password updates through this endpoint
    if (updateData.password) delete updateData.password;

    const updated = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");
    if (!updated)
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json({ message: "Kullanıcı güncellendi", user: updated });
  } catch (error) {
    next(error);
  }
});

// Admin: delete a user
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  async (req, res, next) => {
    try {
      const deleted = await User.findByIdAndDelete(req.params.id).select(
        "-password",
      );
      if (!deleted)
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      res.json({ message: "Kullanıcı silindi", user: deleted });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
