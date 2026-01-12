const express = require("express");
const router = express.Router();
const gradeController = require("../controllers/gradeController");
const verifyToken = require("../middlewares/verifyToken");

// Sınav bitince tetiklenecek
router.post("/create", verifyToken, gradeController.createGrade);

// Öğrenci notlarım sayfası için
router.get("/student/my-grades", verifyToken, gradeController.getMyGrades);

module.exports = router;
