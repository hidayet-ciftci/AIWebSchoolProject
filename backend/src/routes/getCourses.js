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

// Öğretmenin kendi derslerini getirmesi
router.get(
  "/teacher/my-courses",
  verifyToken,
  courseController.getTeacherCourses
);

// Öğrencinin kendi derslerini getirmesi
router.get(
  "/student/my-courses",
  verifyToken,
  courseController.getStudentCourses
);

// Materyal Yükleme (Sadece öğretmen yapabilir mantığı eklenebilir)
// 'file' html formundaki input name="file" ile aynı olmalı
router.post(
  "/:id/upload",
  verifyToken,
  upload.single("file"),
  courseController.uploadMaterial
);

// Materyal Silme
router.delete(
  "/:id/materials/:materialId",
  verifyToken,
  courseController.deleteMaterial
);

// Tekil ders detayı (Notları da içerir)
router.get("/:id", verifyToken, courseController.getCourseById);

module.exports = router;
