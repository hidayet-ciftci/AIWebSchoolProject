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

const getTeacherCourses = async (req, res, next) => {
  try {
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

const getStudentCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const courses = await Course.find({ students: studentId }).populate(
      "teacher",
      "name surname"
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

    const newMaterial = {
      title: title || req.file.originalname,
      fileName: req.file.filename,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      uploadedAt: Date.now(),
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

const deleteMaterial = async (req, res, next) => {
  try {
    const { id, materialId } = req.params;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $pull: { materials: { _id: materialId } } },
      { new: true }
    );

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
