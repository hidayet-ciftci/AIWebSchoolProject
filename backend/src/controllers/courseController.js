const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const { enqueueMaterialIngestion } = require("../queue/ragIngestionQueue");
const { deleteMaterialVectors } = require("../services/pythonRagClient");

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
      .populate("teacher", "name surname email")
      .populate("students", "name surname studentNo");
    if (!course) return res.status(404).json({ message: "Ders bulunamadı" });
    res.status(200).json(course);
  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { name, courseCode, teacher, students, lessonNumber, studentNumber } =
      req.body;
    const teacherExist = await User.findById(teacher);
    if (!teacherExist)
      return res.status(400).json({ message: "Öğretmen bulunamadı" });
    if (teacherExist.role !== "teacher")
      return res.status(400).json({ message: "Bu kullanıcı öğretmen değil" });
    if (students && students.length > 0) {
      const count = await User.countDocuments({ _id: { $in: students } });
      if (count !== students.length)
        return res
          .status(400)
          .json({ message: "Bazı öğrenci ID'leri geçersiz" });
    }
    // validation: name and courseCode must be present and not identical
    if (!name || !courseCode)
      return res
        .status(400)
        .json({ message: "Ders adı ve ders kodu gereklidir" });
    if (String(name).trim() === String(courseCode).trim())
      return res
        .status(400)
        .json({ message: "Ders adı ve ders kodu aynı olamaz" });
    // basit duplicate kontrolü (aynı isim veya kod varsa reddet)
    const nameExists = await Course.findOne({ name: name });
    if (nameExists)
      return res.status(400).json({ message: "Bu ders adı zaten kayıtlı" });
    const codeExists = await Course.findOne({ courseCode: courseCode });
    if (codeExists)
      return res.status(400).json({ message: "Bu ders kodu zaten kayıtlı" });

    const courseData = { ...req.body };
    const createdCourse = await Course.create(courseData);
    res.status(201).json({ message: "Ders oluşturuldu", createdCourse });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    const existing = await Course.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Ders bulunamadı" });

    const newName =
      updateData.name !== undefined
        ? String(updateData.name).trim()
        : existing.name;
    const newCode =
      updateData.courseCode !== undefined
        ? String(updateData.courseCode).trim()
        : existing.courseCode;

    if (!newName || !newCode) {
      return res.status(400).json({ message: "Ders adı ve kodu boş olamaz" });
    }

    if (newName === newCode) {
      return res
        .status(400)
        .json({ message: "Ders adı ve ders kodu aynı olamaz" });
    }

    // basit conflict kontrolü: başka bir kayıt aynı isim veya kodu kullanıyorsa reddet
    const nameConflict = await Course.findOne({
      name: newName,
      _id: { $ne: req.params.id },
    });
    if (nameConflict)
      return res
        .status(400)
        .json({ message: "Bu ders adı başka bir kayıtta kullanılıyor" });
    const codeConflict = await Course.findOne({
      courseCode: newCode,
      _id: { $ne: req.params.id },
    });
    if (codeConflict)
      return res
        .status(400)
        .json({ message: "Bu ders kodu başka bir kayıtta kullanılıyor" });

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    res
      .status(200)
      .json({ message: "Ders güncellendi", updateCourse: updatedCourse });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse)
      return res.status(404).json({ message: "Ders bulunamadı" });
    res.status(200).json({ message: "Ders silindi", deletedCourse });
  } catch (error) {
    next(error);
  }
};

const getTeacherCourses = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const courses = await Course.find({ teacher: teacherId }).populate(
      "students",
      "name surname studentNo",
    );
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

const getStudentCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const courses = await Course.find({ students: studentId }).populate(
      "teacher",
      "name surname",
    );
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

const uploadMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Dosya yüklenmedi" });
    }

    const materialId = new mongoose.Types.ObjectId();
    const newMaterial = {
      _id: materialId,
      title: title || req.file.originalname,
      fileName: req.file.filename,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      mimeType: req.file.mimetype,
      status: "pending",
      hash: "",
      chunksCount: 0,
      indexingError: "",
      uploadedAt: Date.now(),
    };

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $push: { materials: newMaterial } },
      { new: true },
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Ders bulunamadı" });
    }

    let queueStatus = "queued";

    try {
      await enqueueMaterialIngestion({
        courseId: String(id),
        materialId: String(materialId),
        filePath: path.resolve(req.file.path),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
    } catch (queueError) {
      queueStatus = "failed";
      await Course.updateOne(
        { _id: id, "materials._id": materialId },
        {
          $set: {
            "materials.$.status": "failed",
            "materials.$.indexingError": `Queue hatası: ${queueError.message}`,
          },
        },
      );
    }

    const finalCourse = await Course.findById(id);

    res.status(202).json({
      message:
        queueStatus === "queued"
          ? "Materyal yüklendi ve indeksleme sıraya alındı"
          : "Materyal yüklendi ancak indeksleme sıraya alınamadı",
      queueStatus,
      course: finalCourse,
    });
  } catch (err) {
    next(err);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    const { id, materialId } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Ders bulunamadı" });
    }

    const material = course.materials.id(materialId);
    if (!material) {
      return res.status(404).json({ message: "Materyal bulunamadı" });
    }

    try {
      await deleteMaterialVectors(String(materialId));
    } catch (vectorError) {
      console.error("Vektör silme hatası:", vectorError.message);
    }

    const diskPath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "notes",
      material.fileName,
    );

    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    course.materials.pull({ _id: materialId });
    await course.save();

    res.status(200).json({ message: "Materyal silindi", course });
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
