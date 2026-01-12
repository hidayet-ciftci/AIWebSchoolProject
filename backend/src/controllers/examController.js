// backend/src/controllers/examController.js

const Exam = require("../models/Exam");
const Course = require("../models/Course");
const Grade = require("../models/Grade");

// 1. Yeni Sınav Oluştur (Sadece iskelet)
// 1. Yeni Sınav Oluştur
const createExam = async (req, res) => {
  try {
    // time parametresini de req.body'den alıyoruz
    const { courseId, examType, date, time, duration, weight, teacherId } =
      req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Seçilen ders bulunamadı." });
    }

    // Ağırlık kontrolü: Bu ders için mevcut sınavların toplam ağırlığını hesapla
    const existingExams = await Exam.find({
      course: courseId,
      teacher: teacherId,
    });

    const totalWeight = existingExams.reduce(
      (sum, exam) => sum + (exam.weight || 0),
      0
    );

    // Yeni ağırlık eklendiğinde toplam 100'ü geçmemeli
    if (totalWeight + weight > 100) {
      return res.status(400).json({
        message: `Bu ders için toplam ağırlık 100'ü geçemez. Mevcut toplam: ${totalWeight}%, Yeni ağırlık: ${weight}%. Toplam: ${totalWeight + weight}%`,
      });
    }

    // --- KRİTİK GÜNCELLEME BURASI ---
    // Tarih ve Saati birleştirip tam bir zaman damgası oluşturuyoruz.
    // Gelen date: "2025-02-20", time: "14:30" -> Date Objesi
    const fullDate = new Date(`${date}T${time}:00`);
    // -------------------------------

    const formattedType = examType.charAt(0).toUpperCase() + examType.slice(1);
    const generatedTitle = `${course.name} ${formattedType} Sınavı`;

    const newExam = new Exam({
      title: generatedTitle,
      course: courseId,
      teacher: teacherId,
      examType,
      date: fullDate, // Artık saati de içeren tam tarih
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

const getMyExams = async (req, res) => {
  try {
    // 1. Token'dan gelen kullanıcı ID'sini alıyoruz (verifyToken middleware'i bunu req.user içine koyar)
    const studentId = req.user.id;

    // 2. Bu öğrencinin kayıtlı olduğu dersleri buluyoruz
    // Course modelindeki 'students' dizisinde bu ID var mı diye bakıyoruz.
    const enrolledCourses = await Course.find({ students: studentId }).select(
      "_id"
    );

    // Sadece ID'lerden oluşan bir liste yapıyoruz: ["dersId1", "dersId2"]
    const courseIds = enrolledCourses.map((course) => course._id);

    // Eğer hiç dersi yoksa boş dizi dönüyoruz
    if (courseIds.length === 0) {
      return res.status(200).json([]);
    }

    // 3. Bu derslere ait ve YAYINLANMIŞ (isPublished: true) sınavları getiriyoruz
    const exams = await Exam.find({
      course: { $in: courseIds },
      isPublished: true,
    })
      .populate("course", "name courseCode") // Ders adını da getir
      .populate("teacher", "name surname") // Hoca adını da getir
      .sort({ date: 1 }); // Yaklaşan tarihe göre sırala

    // 4. Her sınav için öğrencinin girip girmediğini kontrol et
    const examsWithStatus = await Promise.all(
      exams.map(async (exam) => {
        const examObj = exam.toObject();
        // Bu öğrencinin bu sınava ait notu var mı?
        const grade = await Grade.findOne({
          exam: exam._id,
          student: studentId,
        });
        examObj.isCompleted = !!grade; // Eğer not varsa sınav tamamlanmış demektir
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
    const studentId = req.user.id; // verifyToken middleware'inden gelen ID

    // --- YENİ KONTROL: Öğrenci daha önce bu sınava girmiş mi? ---
    const existingGrade = await Grade.findOne({
      exam: id,
      student: studentId,
    });

    if (existingGrade) {
      // Eğer notu varsa, sınava tekrar girmesine izin verme
      return res.status(403).json({
        message: "Bu sınavı zaten tamamladınız.",
        isTaken: true,
      });
    }
    // -------------------------------------------------------------

    // 1. Sınavı bul
    const exam = await Exam.findById(id).populate("course", "name");

    if (!exam) {
      return res.status(404).json({ message: "Sınav bulunamadı." });
    }

    // 2. Tarih ve Süre Kontrolü
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

    // 3. Soruları Güvenli Hale Getir
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
