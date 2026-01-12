const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/create", verifyToken, examController.createExam);

router.get(
  "/teacher/:teacherId",
  verifyToken,
  examController.getExamsByTeacher
);

router.get("/student/my-exams", verifyToken, examController.getMyExams);

router.get(
  "/student/take/:id",
  verifyToken,
  examController.getExamForStudentToTake
);

router.get("/:id", verifyToken, examController.getExamById);
router.put("/:id", verifyToken, examController.updateExam);
router.delete("/:id", verifyToken, examController.deleteExam);

module.exports = router;
