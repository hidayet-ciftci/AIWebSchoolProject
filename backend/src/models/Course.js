const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courseCode: { type: String, required: true },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  ],
  lessonNumber: { type: Number, required: true },
  source: { type: String, default: "" },
  status: { type: String },
  materials: [
    {
      title: { type: String },
      fileName: { type: String },
      fileUrl: { type: String },
      mimeType: { type: String, default: "" },
      hash: { type: String, default: "" },
      status: {
        type: String,
        enum: ["pending", "processing", "ready", "failed"],
        default: "pending",
      },
      chunksCount: { type: Number, default: 0 },
      textExtractedAt: { type: Date, default: null },
      indexingError: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("courses", courseSchema);
