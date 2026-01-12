const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/create", verifyToken, examController.createExam);

// Öğretmen sınavları
router.get(
  "/teacher/:teacherId",
  verifyToken,
  examController.getExamsByTeacher
);

// Öğrenci sınavları (Listeleme)
router.get("/student/my-exams", verifyToken, examController.getMyExams);

// --- EKLENEN KISIM BAŞLANGIÇ ---
// Öğrenci sınava giriş (Detay ve Soru getirme)
// DİKKAT: Bu satırı "/:id" satırından ÖNCE yazmalısın.
router.get(
  "/student/take/:id",
  verifyToken,
  examController.getExamForStudentToTake
);
// --- EKLENEN KISIM BİTİŞ ---

// Genel ID işlemleri (Bunlar en sonda olmalı)
router.get("/:id", verifyToken, examController.getExamById);
router.put("/:id", verifyToken, examController.updateExam);
router.delete("/:id", verifyToken, examController.deleteExam);

module.exports = router;
