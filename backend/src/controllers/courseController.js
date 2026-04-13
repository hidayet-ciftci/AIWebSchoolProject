const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const { enqueueMaterialIngestion } = require("../queue/ragIngestionQueue");
const { deleteMaterialChunks } = require("../services/rag/chromaService");

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
      { new: true },
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
      return res.status(400).json({ message: "No file uploaded" });
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
      return res.status(404).json({ message: "Course not found" });
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
          ? "Material uploaded and indexing queued"
          : "Material uploaded but indexing could not be queued",
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
      return res.status(404).json({ message: "Course not found" });
    }

    const material = course.materials.id(materialId);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    try {
      await deleteMaterialChunks({ materialId: String(materialId) });
    } catch (vectorError) {
      console.error("Chroma silme hatası:", vectorError.message);
    }

    const diskPath = path.join(
      process.cwd(),
      material.fileUrl.replace(/^\/+/, "").replace(/\//g, path.sep),
    );

    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    course.materials.pull({ _id: materialId });
    await course.save();

    res.status(200).json({ message: "Material deleted", course });
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
