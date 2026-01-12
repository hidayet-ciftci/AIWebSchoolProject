const express = require("express");
const router = express.Router();
const gradeController = require("../controllers/gradeController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/create", verifyToken, gradeController.createGrade);
router.get("/student/my-grades", verifyToken, gradeController.getMyGrades);
router.get("/teacher/my-grades", verifyToken, gradeController.getTeacherGrades);

module.exports = router;
