const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses", // Course modelindeki isimlendirmene dikkat et
    required: true,
  },
  score: { type: Number, required: true }, // Alınan Puan
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  answers: [
    {
      questionId: { type: String },
      givenAnswer: { type: String },
      isCorrect: { type: Boolean },
    },
  ],
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Grade", gradeSchema);
