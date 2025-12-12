const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: {
    type: mongoose.Schema.Types.ObjectId, // Veri tipini, MongoDB'nin kimlik türü olan ObjectId olarak ayarla
    ref: "Users", // Bu ObjectId'nin hangi modele ait olduğunu belirt (User.js'deki model adı "Users" idi)
    required: true,
  },
  students: [
    {
      // Array kullanıyoruz, çünkü birden fazla öğrenci var.
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // Öğrenci de bir User olduğu için yine "Users" modeline referans veriyoruz
    },
  ],
  lessonNumber: { type: Number, required: true },
  // Not: Artık öğrenci sayısını bu dizinin uzunluğundan alabileceğiniz için,
  // 'studentNumber' alanı modelde gereksiz hale gelebilir.
  studentNumber: { type: Number },
  source: { type: String, default: "" },
  status: { type: String },
});

module.exports = mongoose.model("courses", courseSchema); //
