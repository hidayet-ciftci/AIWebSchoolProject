const Grade = require("../models/Grade");
const Exam = require("../models/Exam");
const Course = require("../models/Course");

const createGrade = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Sınav bulunamadı." });

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const resultDetails = [];

    exam.questions.forEach((q) => {
      const studentAnswer = answers[q._id] || "";
      const correctAnswer = q.correctAnswer || "";

      const isCorrect =
        studentAnswer.trim().toLowerCase() ===
        correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        totalScore += q.points;
        correctCount++;
      } else {
        wrongCount++;
      }

      resultDetails.push({
        questionId: q._id,
        givenAnswer: studentAnswer,
        isCorrect: isCorrect,
      });
    });

    const newGrade = new Grade({
      student: studentId,
      exam: examId,
      course: exam.course,
      score: totalScore,
      correctCount,
      wrongCount,
      answers: resultDetails,
    });

    await newGrade.save();

    res.status(201).json({
      message: "Sınav tamamlandı ve not kaydedildi.",
      score: totalScore,
      correctCount,
      wrongCount,
      totalQuestions: exam.questions.length,
    });
  } catch (error) {
    console.error("Not kaydetme hatası:", error);
    res
      .status(500)
      .json({ message: "Not kaydedilemedi", error: error.message });
  }
};

const getMyGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrolledCourses = await Course.find({ students: studentId }).select(
      "_id"
    );
    const courseIds = enrolledCourses.map((course) => course._id);

    if (courseIds.length === 0) {
      return res.status(200).json([]);
    }

    const allExams = await Exam.find({
      course: { $in: courseIds },
      isPublished: true,
    })
      .populate("course", "name courseCode")
      .populate("teacher", "name surname")
      .sort({ date: 1 });

    const existingGrades = await Grade.find({ student: studentId })
      .populate("course", "name courseCode")
      .populate({
        path: "exam",
        select: "title examType date weight",
        populate: { path: "teacher", select: "name surname" },
      });

    const gradesWithAllExams = allExams.map((exam) => {
      const grade = existingGrades.find(
        (g) => g.exam && g.exam._id.toString() === exam._id.toString()
      );

      if (grade && grade.exam && grade.course) {
        return {
          _id: grade._id,
          score: grade.score,
          correctCount: grade.correctCount,
          wrongCount: grade.wrongCount,
          submittedAt: grade.submittedAt,
          course: grade.course,
          exam: {
            _id: exam._id,
            title: exam.title,
            examType: exam.examType,
            date: exam.date,
            weight: exam.weight,
            teacher: exam.teacher,
          },
        };
      } else {
        return {
          _id: null,
          score: null,
          correctCount: 0,
          wrongCount: 0,
          submittedAt: null,
          course: exam.course,
          exam: {
            _id: exam._id,
            title: exam.title,
            examType: exam.examType,
            date: exam.date,
            weight: exam.weight,
            teacher: exam.teacher,
          },
        };
      }
    });

    res.status(200).json(gradesWithAllExams);
  } catch (error) {
    console.error("Notlar alınamadı:", error);
    res.status(500).json({ message: "Notlar alınamadı", error: error.message });
  }
};

const getTeacherGrades = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const teacherCourses = await Course.find({ teacher: teacherId }).select(
      "_id name courseCode"
    );

    if (teacherCourses.length === 0) {
      return res.status(200).json([]);
    }

    const courseIds = teacherCourses.map((course) => course._id);

    const exams = await Exam.find({
      course: { $in: courseIds },
      isPublished: true,
    })
      .populate("course", "name courseCode")
      .select("_id title examType date weight course");

    const coursesWithStudents = await Course.find({
      _id: { $in: courseIds },
    }).populate("students", "name surname studentNo");

    const coursesWithGrades = await Promise.all(
      teacherCourses.map(async (course) => {
        const courseObj = course.toObject();

        const courseData = coursesWithStudents.find(
          (c) => c._id.toString() === course._id.toString()
        );
        const students = courseData?.students || [];

        const courseExams = exams.filter(
          (exam) => exam.course._id.toString() === course._id.toString()
        );

        const studentsWithGrades = await Promise.all(
          students.map(async (student) => {
            const studentObj = {
              _id: student._id,
              name: student.name,
              surname: student.surname,
              studentNo: student.studentNo,
              exams: [],
              weightedAverage: 0,
              totalWeight: 0,
            };

            for (const exam of courseExams) {
              const grade = await Grade.findOne({
                exam: exam._id,
                student: student._id,
              });

              studentObj.exams.push({
                examId: exam._id,
                examTitle: exam.title,
                examType: exam.examType,
                score: grade ? grade.score : null,
                weight: exam.weight,
                date: exam.date,
              });
            }

            let weightedSum = 0;
            let totalWeight = 0;
            studentObj.exams.forEach((exam) => {
              if (exam.score !== null) {
                weightedSum += exam.score * exam.weight;
                totalWeight += exam.weight;
              }
            });

            studentObj.weightedAverage =
              totalWeight > 0 ? weightedSum / totalWeight : 0;
            studentObj.totalWeight = totalWeight;

            return studentObj;
          })
        );

        courseObj.students = studentsWithGrades;

        const examTypeAverages = {};
        let overallSum = 0;
        let overallCount = 0;

        studentsWithGrades.forEach((student) => {
          student.exams.forEach((exam) => {
            if (exam.score !== null) {
              if (!examTypeAverages[exam.examType]) {
                examTypeAverages[exam.examType] = { sum: 0, count: 0 };
              }
              examTypeAverages[exam.examType].sum += exam.score;
              examTypeAverages[exam.examType].count += 1;
              overallSum += exam.score;
              overallCount += 1;
            }
          });
        });

        const examTypeStats = {};
        Object.keys(examTypeAverages).forEach((type) => {
          examTypeStats[type] =
            examTypeAverages[type].count > 0
              ? examTypeAverages[type].sum / examTypeAverages[type].count
              : 0;
        });

        courseObj.examTypeAverages = examTypeStats;
        courseObj.overallAverage =
          overallCount > 0 ? overallSum / overallCount : 0;

        return courseObj;
      })
    );

    res.status(200).json(coursesWithGrades);
  } catch (error) {
    console.error("Öğretmen notları hatası:", error);
    res.status(500).json({ message: "Notlar alınamadı", error: error.message });
  }
};

module.exports = {
  createGrade,
  getMyGrades,
  getTeacherGrades,
};
