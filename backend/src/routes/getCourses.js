const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const courseController = require("../controllers/courseController");
const verifyToken = require("../middlewares/verifyToken");
const upload = require("../middlewares/upload");

router.get("/list1", async (req, res, next) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

router.get("/", courseController.getCourses);
router.post("/create", courseController.createCourse);

router.get("/:id", courseController.getCourseById);
router.put("/update/:id", courseController.updateCourse);
router.delete("/delete/:id", courseController.deleteCourse);

router.get(
  "/teacher/my-courses",
  verifyToken,
  courseController.getTeacherCourses
);

router.get(
  "/student/my-courses",
  verifyToken,
  courseController.getStudentCourses
);

router.post(
  "/:id/upload",
  verifyToken,
  upload.single("file"),
  courseController.uploadMaterial
);

router.delete(
  "/:id/materials/:materialId",
  verifyToken,
  courseController.deleteMaterial
);

module.exports = router;
