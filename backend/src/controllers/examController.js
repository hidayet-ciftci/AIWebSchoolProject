// backend/src/controllers/examController.js

const Exam = require("../models/Exam");
const Course = require("../models/Course");

// 1. Yeni Sınav Oluştur (Sadece iskelet)
const createExam = async (req, res) => {
  try {
    const { courseId, examType, date, duration, weight, teacherId } = req.body;

    // Dersi bul (Başlık için)
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Seçilen ders bulunamadı." });
    }

    // Başlık Oluştur: Matematik Vize Sınavı
    const formattedType = examType.charAt(0).toUpperCase() + examType.slice(1);
    const generatedTitle = `${course.name} ${formattedType} Sınavı`;

    const newExam = new Exam({
      title: generatedTitle,
      course: courseId,
      teacher: teacherId,
      examType,
      date,
      duration,
      weight,
      questions: [], // Başlangıçta soru yok
    });

    await newExam.save();

    res.status(201).json({
      message: "Sınav başarıyla oluşturuldu",
      exam: newExam,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Sınav oluşturulurken hata oluştu",
      error: error.message,
    });
  }
};

// 2. Öğretmene ait sınavları getir
const getExamsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const exams = await Exam.find({ teacher: teacherId })
      .populate("course", "name courseCode")
      .sort({ date: -1 });

    res.status(200).json(exams);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Sınavlar alınamadı", error: error.message });
  }
};

// 3. Tek bir sınavı detaylı getir
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("course");
    if (!exam) return res.status(404).json({ message: "Sınav bulunamadı" });
    res.status(200).json(exam);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Sınav detayları alınamadı", error: error.message });
  }
};

// 4. Sınavı Güncelle
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExam = await Exam.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedExam)
      return res.status(404).json({ message: "Sınav bulunamadı" });
    res.status(200).json(updatedExam);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Güncelleme hatası", error: error.message });
  }
};

// 5. Sınav Sil
const deleteExam = async (req, res) => {
  try {
    const deletedExam = await Exam.findByIdAndDelete(req.params.id);
    if (!deletedExam)
      return res.status(404).json({ message: "Sınav bulunamadı" });
    res.status(200).json({ message: "Sınav başarıyla silindi" });
  } catch (error) {
    res.status(500).json({ message: "Silme hatası", error: error.message });
  }
};

module.exports = {
  createExam,
  getExamsByTeacher,
  getExamById,
  updateExam,
  deleteExam,
};
