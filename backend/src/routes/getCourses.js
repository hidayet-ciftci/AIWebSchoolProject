const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const courseController = require("../controllers/courseController");

router.get("/list1", async (req, res, next) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

router.get("/", courseController.getCourses);
router.get("/:id", courseController.getCourseById);

router.post("/create", courseController.createCourse);
router.put("/update", courseController.updateCourse);
router.delete("/delete", courseController.deleteCourse);

module.exports = router;
