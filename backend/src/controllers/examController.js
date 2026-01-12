const Exam = require("../models/Exam");
const Course = require("../models/Course");
const Grade = require("../models/Grade");

const createExam = async (req, res) => {
  try {
    const { courseId, examType, date, time, duration, weight, teacherId } =
      req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Seçilen ders bulunamadı." });
    }

    const existingExams = await Exam.find({
      course: courseId,
      teacher: teacherId,
    });

    const totalWeight = existingExams.reduce(
      (sum, exam) => sum + (exam.weight || 0),
      0
    );

    if (totalWeight + weight > 100) {
      return res.status(400).json({
        message: `Bu ders için toplam ağırlık 100'ü geçemez. Mevcut toplam: ${totalWeight}%, Yeni ağırlık: ${weight}%. Toplam: ${
          totalWeight + weight
        }%`,
      });
    }

    const fullDate = new Date(`${date}T${time}:00`);
    const formattedType = examType.charAt(0).toUpperCase() + examType.slice(1);
    const generatedTitle = `${course.name} ${formattedType} Sınavı`;

    const newExam = new Exam({
      title: generatedTitle,
      course: courseId,
      teacher: teacherId,
      examType,
      date: fullDate,
      duration,
      weight,
      questions: [],
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

const getMyExams = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrolledCourses = await Course.find({ students: studentId }).select(
      "_id"
    );

    const courseIds = enrolledCourses.map((course) => course._id);

    if (courseIds.length === 0) {
      return res.status(200).json([]);
    }

    const exams = await Exam.find({
      course: { $in: courseIds },
      isPublished: true,
    })
      .populate("course", "name courseCode")
      .populate("teacher", "name surname")
      .sort({ date: 1 });

    const examsWithStatus = await Promise.all(
      exams.map(async (exam) => {
        const examObj = exam.toObject();
        const grade = await Grade.findOne({
          exam: exam._id,
          student: studentId,
        });
        examObj.isCompleted = !!grade;
        return examObj;
      })
    );

    res.status(200).json(examsWithStatus);
  } catch (error) {
    console.error("Öğrenci sınavları hatası:", error);
    res
      .status(500)
      .json({ message: "Sınavlar alınamadı", error: error.message });
  }
};
const getExamForStudentToTake = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const existingGrade = await Grade.findOne({
      exam: id,
      student: studentId,
    });

    if (existingGrade) {
      return res.status(403).json({
        message: "Bu sınavı zaten tamamladınız.",
        isTaken: true,
      });
    }

    const exam = await Exam.findById(id).populate("course", "name");

    if (!exam) {
      return res.status(404).json({ message: "Sınav bulunamadı." });
    }

    const now = new Date();
    const examStartDate = new Date(exam.date);
    const examEndDate = new Date(
      examStartDate.getTime() + exam.duration * 60000
    );

    if (now < examStartDate) {
      return res.status(403).json({ message: "Sınav henüz başlamadı." });
    }

    if (now > examEndDate) {
      return res
        .status(403)
        .json({ message: "Sınav süresi doldu, giriş yapamazsınız." });
    }

    const examObj = exam.toObject();
    const safeQuestions = examObj.questions.map((q) => {
      const { correctAnswer, ...safeQuestion } = q;
      return safeQuestion;
    });

    const remainingTime = examEndDate.getTime() - now.getTime();

    res.status(200).json({
      ...examObj,
      questions: safeQuestions,
      remainingTime: remainingTime,
    });
  } catch (error) {
    console.error("Sınav detayı hatası:", error);
    res
      .status(500)
      .json({ message: "Sınav verisi alınamadı", error: error.message });
  }
};
module.exports = {
  createExam,
  getExamsByTeacher,
  getExamById,
  updateExam,
  deleteExam,
  getMyExams,
  getExamForStudentToTake,
};
