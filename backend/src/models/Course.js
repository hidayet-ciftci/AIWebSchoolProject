const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: { type: String, required: true },
  lessonNumber: { type: Number, required: true },
  studentNumber: { type: Number },
  source: { type: String, default: "" },
  status: { type: String },
});

module.exports = mongoose.model("courses", courseSchema);
