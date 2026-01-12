const Course = require("../models/Course");
const User = require("../models/User");

const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate("teacher", "name surname email")
      .populate("students", "name surname studentNo");
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", "name surname email") // populate kullanmazsak sadece ID görürüz
      .populate("students", "name surname studentNo"); // populate kullanırsak, ID yerine belirttiğimiz bilgileri görürüz
    if (!course) return res.status(404).json({ message: "course not Found" });
    res.status(200).json(course);
  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { name, teacher, students, lessonNumber, studentNumber } = req.body;
    const teacherExist = await User.findById(teacher);
    if (!teacherExist)
      return res.status(400).json({ message: "Teacher not Found" });
    if (teacherExist.role !== "teacher")
      return res.status(400).json({ message: "this is not teacher" });
    if (students && students.length > 0) {
      const count = await User.countDocuments({ _id: { $in: students } });
      if (count !== students.length)
        return res
          .status(400)
          .json({ message: "some of students ID is not valid " });
    }
    const courseData = { ...req.body };
    const createdCourse = await Course.create(courseData);
    res.status(201).json({ message: "course Created", createdCourse });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    const updateCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updateCourse)
      return res.status(404).json({ message: "course not Found" });
    res.status(200).json({ message: "course updated", updateCourse });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse)
      return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "course deleted", deletedCourse });
  } catch (error) {
    next(error);
  }
};

// ÖĞRETMEN İÇİN: Sadece kendi verdiği dersleri getir
const getTeacherCourses = async (req, res, next) => {
  try {
    // req.user.id token'dan gelmeli
    const teacherId = req.user.id;
    const courses = await Course.find({ teacher: teacherId }).populate(
      "students",
      "name surname studentNo"
    );
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

// ÖĞRENCİ İÇİN: Sadece kayıtlı olduğu dersleri getir
const getStudentCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    // students array'i içinde bu öğrencinin ID'si var mı diye bakar
    const courses = await Course.find({ students: studentId }).populate(
      "teacher",
      "name surname"
    );
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

// MATERYAL (NOT) YÜKLEME
const uploadMaterial = async (req, res, next) => {
  try {
    const { id } = req.params; // Course ID
    const { title } = req.body;

    // Multer middleware'i kullanıldıysa dosya req.file içinde olur
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newMaterial = {
      title: title || req.file.originalname,
      fileName: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`, // Dosya yolu (backend serve ayarına göre değişir)
    };

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $push: { materials: newMaterial } },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Material uploaded", course: updatedCourse });
  } catch (err) {
    next(err);
  }
};

// MATERYAL SİLME
const deleteMaterial = async (req, res, next) => {
  try {
    const { id, materialId } = req.params; // Course ID ve Material ID

    // Veritabanından materyali diziden çıkar
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $pull: { materials: { _id: materialId } } },
      { new: true }
    );

    // İsteğe bağlı: fs.unlink ile dosyayı klasörden de fiziksel olarak silebilirsin.

    res
      .status(200)
      .json({ message: "Material deleted", course: updatedCourse });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getTeacherCourses,
  getStudentCourses,
  uploadMaterial,
  deleteMaterial,
};
