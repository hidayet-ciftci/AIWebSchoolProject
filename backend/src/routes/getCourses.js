const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const verifyToken = require("../middlewares/verifyToken");

router.get("/", async (req, res, next) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
