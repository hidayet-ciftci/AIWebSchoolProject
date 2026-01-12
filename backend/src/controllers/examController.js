const Exam = require("../models/Exam");

// 1. Yeni Sınav Oluştur (Sadece başlık, tarih vb. Sorular sonra eklenecek)
exports.createExam = async (req, res) => {
  try {
    const { title, courseId, examType, date, duration, weight, teacherId } =
      req.body;

    const newExam = new Exam({
      title,
      course: courseId,
      teacher: teacherId, // Bunu frontend'den veya token'dan alacağız
      examType,
      date,
      duration,
      weight,
    });

    await newExam.save();
    res
      .status(201)
      .json({ message: "Sınav başarıyla oluşturuldu", exam: newExam });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Sınav oluşturulurken hata", error: error.message });
  }
};

// 2. Öğretmene ait sınavları getir
exports.getExamsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    // course bilgilerini de populate ederek getiriyoruz
    const exams = await Exam.find({ teacher: teacherId }).populate(
      "course",
      "name courseCode"
    );
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: "Sınavlar alınamadı", error });
  }
};

// 3. Tek bir sınavı detaylı getir (Düzenleme sayfası için)
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("course");
    if (!exam) return res.status(404).json({ message: "Sınav bulunamadı" });
    res.status(200).json(exam);
  } catch (error) {
    res.status(500).json({ message: "Hata", error });
  }
};

// 4. Sınavı Güncelle (Soru ekleme, düzenleme burada yapılacak)
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExam = await Exam.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedExam);
  } catch (error) {
    res.status(500).json({ message: "Güncelleme hatası", error });
  }
};

// 5. Sınav Sil
exports.deleteExam = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Sınav silindi" });
  } catch (error) {
    res.status(500).json({ message: "Silme hatası", error });
  }
};
