const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  Fname: { type: String, required: true },
  Lname: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["male", "female"], required: true },
  studentNo: { type: Number },
  sicilNo: { type: String },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { type: String, required: true, minlength: 8 },
  role: {
    type: String,
    enum: ["teacher", "student"],
    required: true,
  },
  profileImage: { type: String, default: "" },
});

module.exports = mongoose.model("Users", userSchema);
