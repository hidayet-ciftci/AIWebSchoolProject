"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StudentGrade {
  _id: string;
  name: string;
  surname: string;
  studentNo?: number;
  exams: {
    examId: string;
    examTitle: string;
    examType: string;
    score: number | null;
    weight: number;
    date: string;
  }[];
  weightedAverage: number;
  totalWeight: number;
}

interface CourseGrades {
  _id: string;
  name: string;
  courseCode: string;
  students: StudentGrade[];
  examTypeAverages: { [key: string]: number };
  overallAverage: number;
}

export default function TeacherGradesPage() {
  const [courses, setCourses] = useState<CourseGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/grades/teacher/my-grades`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setCourses(data);
          if (data.length > 0 && !selectedCourse) {
            setSelectedCourse(data[0]._id);
          }
        } else {
          console.error("Notlar çekilemedi");
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [router, selectedCourse]);

  const getExamTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      vize: "Vize",
      quiz: "Quiz",
      final: "Final",
    };
    return labels[type] || type;
  };

  const selectedCourseData = courses.find((c) => c._id === selectedCourse);

  const getExamTypes = () => {
    if (!selectedCourseData) return [];
    const examTypes = new Set<string>();
    selectedCourseData.students.forEach((student) => {
      student.exams.forEach((exam) => {
        examTypes.add(exam.examType);
      });
    });
    return Array.from(examTypes);
  };

  const examTypes = getExamTypes();

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Not Yönetimi</h1>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-lg">
            Henüz hiç dersiniz bulunmamaktadır.
          </p>
        </div>
      ) : (
        <>
          {/* Ders Seçimi */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Ders Seçin
            </label>
            <select
              value={selectedCourse || ""}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full md:w-auto border rounded-lg p-2.5 bg-white text-[#1a202c] font-medium"
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name} ({course.courseCode})
                </option>
              ))}
            </select>
          </div>

          {selectedCourseData && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {examTypes.map((type) => (
                  <div
                    key={type}
                    className="bg-white p-4 rounded-xl shadow-sm text-center border border-gray-100"
                  >
                    <p className="text-gray-500 text-sm mb-1">
                      {getExamTypeLabel(type)} Ort.
                    </p>
                    <p className="text-2xl font-bold text-[#667eea]">
                      {selectedCourseData.examTypeAverages[type]
                        ? selectedCourseData.examTypeAverages[type].toFixed(1)
                        : "-"}
                    </p>
                  </div>
                ))}
                <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-gray-100">
                  <p className="text-gray-500 text-sm mb-1">Genel Ort.</p>
                  <p className="text-2xl font-bold text-[#667eea]">
                    {selectedCourseData.overallAverage.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#f7fafc] text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4">Öğrenci</th>
                        {examTypes.map((type) => (
                          <th key={type} className="p-4">
                            {getExamTypeLabel(type)}
                          </th>
                        ))}
                        <th className="p-4">Ortalama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedCourseData.students.length === 0 ? (
                        <tr>
                          <td
                            colSpan={examTypes.length + 2}
                            className="p-8 text-center text-gray-500"
                          >
                            Bu derste henüz öğrenci bulunmamaktadır.
                          </td>
                        </tr>
                      ) : (
                        selectedCourseData.students.map((student) => (
                          <tr
                            key={student._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-4">
                              <p className="font-semibold text-[#1a202c]">
                                {student.name} {student.surname}
                              </p>
                              {student.studentNo && (
                                <p className="text-xs text-gray-500">
                                  {student.studentNo}
                                </p>
                              )}
                            </td>
                            {examTypes.map((type) => {
                              const examScores = student.exams
                                .filter((exam) => exam.examType === type)
                                .map((exam) => exam.score)
                                .filter((score): score is number => score !== null);

                              const examsOfType = student.exams.filter(
                                (exam) => exam.examType === type
                              );

                              return (
                                <td key={type} className="p-4">
                                  {examsOfType.length === 0 ? (
                                    <span className="text-gray-400">-</span>
                                  ) : examsOfType.length === 1 ? (
                                    <span
                                      className={`font-semibold ${
                                        examsOfType[0].score !== null
                                          ? "text-[#1a202c]"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {examsOfType[0].score !== null
                                        ? examsOfType[0].score
                                        : "G"}
                                    </span>
                                  ) : (
                                    <div className="space-y-1">
                                      {examsOfType.map((exam, idx) => (
                                        <div key={idx} className="text-sm">
                                          <span
                                            className={`font-semibold ${
                                              exam.score !== null
                                                ? "text-[#1a202c]"
                                                : "text-gray-400"
                                            }`}
                                          >
                                            {exam.score !== null ? exam.score : "G"}
                                          </span>
                                          <span className="text-xs text-gray-500 ml-1">
                                            ({exam.weight}%)
                                          </span>
                                        </div>
                                      ))}
                                      {examScores.length > 0 && (
                                        <div className="text-xs text-[#667eea] font-medium">
                                          Ort:{" "}
                                          {(
                                            examScores.reduce((a, b) => a + b, 0) /
                                            examScores.length
                                          ).toFixed(1)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-4">
                              <span className="font-bold text-[#667eea]">
                                {student.weightedAverage > 0
                                  ? student.weightedAverage.toFixed(1)
                                  : "-"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
