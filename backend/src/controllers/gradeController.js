const Grade = require("../models/Grade");
const Exam = require("../models/Exam");

// 1. Sınavı Hesapla ve Not Olarak Kaydet (Sınav Bitince Çağrılır)
const createGrade = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    // Sınavı bul
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Sınav bulunamadı." });

    // Puanlama Mantığı
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const resultDetails = [];

    exam.questions.forEach((q) => {
      const studentAnswer = answers[q._id] || "";
      const correctAnswer = q.correctAnswer || "";

      // Büyük/küçük harf duyarlılığını kaldırarak kontrol et
      const isCorrect =
        studentAnswer.trim().toLowerCase() ===
        correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        totalScore += q.points;
        correctCount++;
      } else {
        wrongCount++;
      }

      resultDetails.push({
        questionId: q._id,
        givenAnswer: studentAnswer,
        isCorrect: isCorrect,
      });
    });

    // Veritabanına Kaydet
    const newGrade = new Grade({
      student: studentId,
      exam: examId,
      course: exam.course,
      score: totalScore,
      correctCount,
      wrongCount,
      answers: resultDetails,
    });

    await newGrade.save();

    res.status(201).json({
      message: "Sınav tamamlandı ve not kaydedildi.",
      score: totalScore,
      correctCount,
      wrongCount,
      totalQuestions: exam.questions.length,
    });
  } catch (error) {
    console.error("Not kaydetme hatası:", error);
    res
      .status(500)
      .json({ message: "Not kaydedilemedi", error: error.message });
  }
};

// 2. Öğrencinin Kendi Notlarını Getir
const getMyGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Notları getir ve ilişkili verileri (Ders, Sınav, Öğretmen) doldur
    const grades = await Grade.find({ student: studentId })
      .populate("course", "name courseCode")
      .populate({
        path: "exam",
        select: "title examType date",
        populate: { path: "teacher", select: "name surname" },
      })
      .sort({ submittedAt: -1 }); // En son girilen sınav en üstte

    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: "Notlar alınamadı", error: error.message });
  }
};

module.exports = {
  createGrade,
  getMyGrades,
};
