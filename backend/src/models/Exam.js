const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ["multiple_choice", "text_input"],
    required: true,
  },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  points: { type: Number, default: 10 },
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses",
    required: true,
  },
  examType: {
    type: String,
    enum: ["vize", "quiz", "final"],
    required: true,
  },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  weight: { type: Number, required: true },
  questions: [questionSchema],
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Exam", examSchema);
