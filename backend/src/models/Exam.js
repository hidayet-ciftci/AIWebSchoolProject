const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ["multiple_choice", "text_input"], // Seçmeli veya Klasik
    required: true,
  },
  options: [{ type: String }], // Eğer çoktan seçmeli ise şıklar burada (A, B, C, D)
  correctAnswer: { type: String, required: true }, // Doğru cevap
  points: { type: Number, default: 10 }, // Sorunun puan değeri
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Örn: "2024 Vize Sınavı"
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses", // Course.js'deki model ismin "courses" idi
    required: true,
  },
  examType: {
    type: String,
    enum: ["vize", "quiz", "final"],
    required: true,
  },
  date: { type: Date, required: true },
  duration: { type: Number, required: true }, // Dakika cinsinden (örn: 45)
  weight: { type: Number, required: true }, // Etki oranı (örn: 30)
  questions: [questionSchema], // Sorular dizisi
  isPublished: { type: Boolean, default: false }, // Öğrencilere görünür mü?
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Exam", examSchema);
