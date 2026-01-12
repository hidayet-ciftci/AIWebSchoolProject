"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

interface Course {
  _id: string;
  name: string;
  courseCode: string;
  students: Array<{
    _id: string;
    name: string;
    surname: string;
    studentNo?: number;
  }>;
}

interface Exam {
  _id: string;
  title: string;
  course: {
    _id: string;
    name: string;
    courseCode: string;
  };
  examType: string;
  date: string;
  duration: number;
  isPublished: boolean;
}

interface CourseGrades {
  _id: string;
  name: string;
  courseCode: string;
  overallAverage: number;
  students: Array<{
    _id: string;
    exams: Array<{ score: number | null }>;
  }>;
}

export default function TeacherDashboardHome() {
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<CourseGrades[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        if (!profile?._id) return;

        const [coursesRes, examsRes, gradesRes] = await Promise.all([
          fetch(
            `http://localhost:5000/api/courses/teacher/my-courses`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(
            `http://localhost:5000/api/exams/teacher/${profile._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(
            `http://localhost:5000/api/grades/teacher/my-grades`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        }

        if (examsRes.ok) {
          const examsData = await examsRes.json();
          setExams(examsData);
        }

        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          setGrades(gradesData);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!profileLoading) {
      fetchData();
    }
  }, [profile, profileLoading]);

  const totalStudents = courses.reduce(
    (sum, course) => sum + (course.students?.length || 0),
    0
  );

  const now = new Date();
  const upcomingExams = exams
    .filter((exam) => {
      const examDate = new Date(exam.date);
      return examDate > now && exam.isPublished;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const pendingExams = exams.filter((exam) => !exam.isPublished);


  // Tarih formatlama
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Kalan gün hesaplama
  const getDaysRemaining = (dateString: string) => {
    const examDate = new Date(dateString);
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExamTypeColor = (examType: string) => {
    const colors: { [key: string]: { bg: string; border: string; text: string } } = {
      vize: { bg: "bg-[#fef5e7]", border: "border-[#f59e0b]", text: "text-[#d97706]" },
      quiz: { bg: "bg-[#e0e7ff]", border: "border-[#667eea]", text: "text-[#667eea]" },
      final: { bg: "bg-[#fce7f3]", border: "border-[#ec4899]", text: "text-[#ec4899]" },
    };
    return colors[examType] || colors.quiz;
  };

  const getStudentCountForExam = (exam: Exam) => {
    const course = courses.find((c) => c._id === exam.course._id);
    return course?.students?.length || 0;
  };

  if (loading || profileLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  const teacherName = profile?.name || "Öğretmen";

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c] mb-2">
            Hoş Geldiniz, {teacherName}! 👋
          </h1>
          <p className="text-[#718096]">
            {courses.length > 0
              ? `${courses.length} dersiniz ve ${upcomingExams.length} yaklaşan sınav var`
              : "Henüz dersiniz bulunmamaktadır"}
          </p>
        </div>
        <div className="bg-white p-4 px-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-[#718096] mb-1">Toplam Öğrenci</p>
          <p className="text-3xl font-bold text-[#667eea]">{totalStudents}</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center text-2xl text-white mb-3">
            📚
          </div>
          <p className="text-sm text-[#718096] mb-1">Aktif Dersler</p>
          <p className="text-2xl font-bold text-[#1a202c]">{courses.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-[#f6ad55] to-[#ed8936] rounded-xl flex items-center justify-center text-2xl text-white mb-3">
            📝
          </div>
          <p className="text-sm text-[#718096] mb-1">Bekleyen Sınavlar</p>
          <p className="text-2xl font-bold text-[#1a202c]">{pendingExams.length}</p>
        </div>


      </div>

      {/* Upcoming Exams */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a202c]">Yaklaşan Sınavlar</h2>
            <Link
              href="/teacher/exams"
              className="text-[#667eea] font-semibold text-sm hover:underline"
            >
              Tümünü Gör →
            </Link>
          </div>
          {upcomingExams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Yaklaşan sınavınız bulunmamaktadır.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingExams.map((exam) => {
                const daysRemaining = getDaysRemaining(exam.date);
                const colors = getExamTypeColor(exam.examType);
                const examTypeLabel =
                  exam.examType.charAt(0).toUpperCase() + exam.examType.slice(1);
                const studentCount = getStudentCountForExam(exam);

                return (
                  <div
                    key={exam._id}
                    className={`p-4 ${colors.bg} border-l-4 ${colors.border} rounded-r-lg`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-[#1a202c]">{exam.title}</p>
                        <p className="text-sm text-[#718096]">
                          {studentCount} Öğrenci Katılacak
                        </p>
                      </div>
                      <span
                        className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold border ${colors.border}`}
                      >
                        {daysRemaining > 0
                          ? `${daysRemaining} Gün Kaldı`
                          : "Bugün"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-[#718096] mb-3">
                      <span>📅 {formatDate(exam.date)}</span>
                      <span>⏱️ {exam.duration} dakika</span>
                      <span className={colors.text}>📝 {examTypeLabel}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/teacher/exams/${exam._id}`)}
                      className="w-full py-2 bg-[#667eea] text-white rounded-lg text-sm font-semibold hover:bg-[#5a6fd6] transition-colors cursor-pointer"
                    >
                      Sınav Detayları
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* My Courses */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1a202c]">Derslerim</h2>
          <Link
            href="/teacher/courses"
            className="text-[#667eea] font-semibold text-sm hover:underline"
          >
            Tümünü Gör →
          </Link>
        </div>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz dersiniz bulunmamaktadır.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => {
              const courseGrade = grades.find((g) => g._id === course._id);
              const studentCount = course.students?.length || 0;

              return (
                <div
                  key={course._id}
                  className="p-4 bg-[#f7fafc] rounded-lg border border-gray-200 hover:border-[#667eea] transition-colors"
                >
                  <p className="font-bold text-[#1a202c] mb-1">{course.name}</p>
                  <p className="text-xs text-[#718096] mb-3">{course.courseCode}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-[#667eea]">
                      👥 {studentCount} Öğrenci
                    </p>
                    {courseGrade && courseGrade.overallAverage > 0 && (
                      <p className="text-sm font-semibold text-[#1a202c]">
                        Ort: {courseGrade.overallAverage.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
