"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Grade {
  _id: string | null;
  score: number | null; // null ise girilmemiş, "G" gösterilecek
  correctCount: number;
  wrongCount: number;
  submittedAt: string | null;
  course: {
    _id: string;
    name: string;
    courseCode: string;
  };
  exam: {
    _id: string;
    title: string;
    examType: "vize" | "quiz" | "final";
    date: string;
    weight: number;
    teacher?: {
      name: string;
      surname: string;
    };
  } | null;
}

interface CourseGrades {
  courseId: string;
  courseName: string;
  courseCode: string;
  exams: {
    examTitle: string;
    examType: string;
    score: number;
    weight: number;
    date: string;
    isGraded: boolean; // Girilmiş mi?
  }[];
  weightedAverage: number;
  totalWeight: number;
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedGrades, setGroupedGrades] = useState<CourseGrades[]>([]);
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
          `http://localhost:5000/api/grades/student/my-grades`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setGrades(data);
          // Derslere göre grupla
          groupGradesByCourse(data);
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
  }, [router]);

  const groupGradesByCourse = (gradesData: Grade[]) => {
    const courseMap = new Map<string, CourseGrades>();

    gradesData.forEach((grade) => {
      // Exam veya course null ise atla
      if (!grade.exam || !grade.course) {
        console.warn("Grade'de exam veya course bilgisi eksik:", grade);
        return;
      }

      const courseId = grade.course._id;
      const courseName = grade.course.name;
      const courseCode = grade.course.courseCode;

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId,
          courseName,
          courseCode,
          exams: [],
          weightedAverage: 0,
          totalWeight: 0,
        });
      }

      const courseData = courseMap.get(courseId)!;
      // Score null ise girilmemiş, 0 olarak al ve "G" göster
      const examScore = grade.score !== null ? grade.score : 0;
      courseData.exams.push({
        examTitle: grade.exam.title,
        examType: grade.exam.examType,
        score: examScore, // null ise 0
        weight: grade.exam.weight,
        date: grade.exam.date,
        isGraded: grade.score !== null, // Girilmiş mi kontrolü
      });
      courseData.totalWeight += grade.exam.weight;
    });

    // Ağırlıklı ortalamayı hesapla
    const grouped: CourseGrades[] = Array.from(courseMap.values()).map(
      (course) => {
        let weightedSum = 0;
        course.exams.forEach((exam) => {
          weightedSum += exam.score * exam.weight;
        });
        course.weightedAverage =
          course.totalWeight > 0 ? weightedSum / course.totalWeight : 0;
        return course;
      }
    );

    setGroupedGrades(grouped);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vize: "Vize",
      quiz: "Quiz",
      final: "Final",
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Notlarım</h1>

      {groupedGrades.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-lg">
            Henüz herhangi bir sınav notunuz bulunmamaktadır.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedGrades.map((course) => (
            <div
              key={course.courseId}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              {/* Ders Başlığı ve Ortalama */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-[#1a202c]">
                    {course.courseName}
                  </h3>
                  <p className="text-sm text-gray-500">{course.courseCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-semibold">
                    Ağırlıklı Ortalama
                  </p>
                  <span className="text-3xl font-bold text-[#667eea]">
                    {course.weightedAverage.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Sınav Listesi */}
              <div className="space-y-3">
                {course.exams.map((exam, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            {getExamTypeLabel(exam.examType)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(exam.date)}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {exam.examTitle}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-[#1a202c]">
                          {exam.isGraded ? exam.score : "G"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ağırlık: %{exam.weight}
                        </p>
                        {!exam.isGraded && (
                          <p className="text-xs text-red-500 italic">
                            Girilmedi
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* İlerleme Çubuğu */}
              <div className="mt-4">
                <div className="w-full bg-[#f7fafc] rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#667eea] to-[#764ba2] h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(course.weightedAverage, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
