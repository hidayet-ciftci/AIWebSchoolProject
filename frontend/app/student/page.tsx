"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

interface Course {
  _id: string;
  name: string;
  courseCode: string;
  teacher: {
    name: string;
    surname: string;
  };
}

interface Exam {
  _id: string;
  title: string;
  course: {
    _id: string;
    name: string;
    courseCode: string;
  };
  teacher: {
    name: string;
    surname: string;
  };
  examType: string;
  date: string;
  duration: number;
  isCompleted?: boolean;
}

interface Grade {
  _id: string | null;
  score: number | null;
  course: {
    _id: string;
    name: string;
    courseCode: string;
  };
  exam: {
    weight: number;
    _id: string;
    title: string;
    examType: string;
    date: string;
  } | null;
  submittedAt: string | null;
}

export default function StudentDashboardHome() {
  const { profile, loading: profileLoading } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const [coursesRes, examsRes, gradesRes] = await Promise.all([
          fetch("http://localhost:5000/api/courses/student/my-courses", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/exams/student/my-exams", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/grades/student/my-grades", {
            headers: { Authorization: `Bearer ${token}` },
          }),
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

    fetchData();
  }, []);

  const now = new Date();
  const upcomingExams = exams
    .filter((exam) => {
      const examDate = new Date(exam.date);
      return examDate > now && !exam.isCompleted;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const completedExamsCount = exams.filter((exam) => exam.isCompleted).length;

  const recentGrades = grades
    .filter((grade) => grade.score !== null && grade.exam)
    .sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  const calculateOverallAverage = () => {
    const courseAverages: {
      [key: string]: { sum: number; totalWeight: number };
    } = {};

    grades.forEach((grade) => {
      if (!grade.exam || grade.score === null) return;

      const courseId = grade.course._id;
      if (!courseAverages[courseId]) {
        courseAverages[courseId] = { sum: 0, totalWeight: 0 };
      }

      courseAverages[courseId].sum += grade.score * grade.exam.weight;
      courseAverages[courseId].totalWeight += grade.exam.weight;
    });

    const averages = Object.values(courseAverages)
      .map((course) => {
        if (course.totalWeight === 0) return null;
        return course.sum / course.totalWeight;
      })
      .filter((avg): avg is number => avg !== null);

    if (averages.length === 0) return null;
    return averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
  };

  const overallAverage = calculateOverallAverage();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysRemaining = (dateString: string) => {
    const examDate = new Date(dateString);
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExamTypeColor = (examType: string) => {
    const colors: {
      [key: string]: { bg: string; border: string; text: string };
    } = {
      vize: {
        bg: "bg-[#fef5e7]",
        border: "border-[#f59e0b]",
        text: "text-[#d97706]",
      },
      quiz: {
        bg: "bg-[#e0e7ff]",
        border: "border-[#667eea]",
        text: "text-[#667eea]",
      },
      final: {
        bg: "bg-[#fce7f3]",
        border: "border-[#ec4899]",
        text: "text-[#ec4899]",
      },
    };
    return colors[examType] || colors.quiz;
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return { bg: "bg-[#f0fff4]", text: "text-[#38a169]" };
    if (score >= 80) return { bg: "bg-[#fef5e7]", text: "text-[#d97706]" };
    if (score >= 70) return { bg: "bg-[#e6fffa]", text: "text-[#319795]" };
    return { bg: "bg-[#fed7d7]", text: "text-[#e53e3e]" };
  };

  if (loading || profileLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  const studentName = profile?.name || "Öğrenci";

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c] mb-2">
            Hoş Geldiniz, {studentName}! 👋
          </h1>
          <p className="text-[#718096]">
            {courses.length > 0
              ? `${courses.length} dersiniz ve ${upcomingExams.length} yaklaşan sınavınız var`
              : "Henüz ders kaydınız bulunmamaktadır"}
          </p>
        </div>
        {overallAverage !== null && (
          <div className="bg-white p-4 px-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-[#718096] mb-1">Genel Ortalama</p>
            <p className="text-3xl font-bold text-[#667eea]">
              {overallAverage.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-linear-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center text-2xl text-white mb-3">
            📚
          </div>
          <p className="text-sm text-[#718096] mb-1">Aktif Dersler</p>
          <p className="text-2xl font-bold text-[#1a202c]">{courses.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-linear-to-br from-[#48bb78] to-[#38a169] rounded-xl flex items-center justify-center text-2xl text-white mb-3">
            ✅
          </div>
          <p className="text-sm text-[#718096] mb-1">Tamamlanan Sınavlar</p>
          <p className="text-2xl font-bold text-[#1a202c]">
            {completedExamsCount}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-linear-to-br from-[#f6ad55] to-[#ed8936] rounded-xl flex items-center justify-center text-2xl text-white mb-3">
            ⏰
          </div>
          <p className="text-sm text-[#718096] mb-1">Yaklaşan Sınavlar</p>
          <p className="text-2xl font-bold text-[#1a202c]">
            {upcomingExams.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-linear-to-br from-[#fc8181] to-[#f56565] rounded-xl flex items-center justify-center text-2xl text-white mb-3">
            📊
          </div>
          <p className="text-sm text-[#718096] mb-1">Toplam Not</p>
          <p className="text-2xl font-bold text-[#1a202c]">
            {grades.filter((g) => g.score !== null).length}
          </p>
        </div>
      </div>

      {/* Split Section: Exams & Grades */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Exams (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a202c]">
              Yaklaşan Sınavlar
            </h2>
            <Link
              href="/student/exam"
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
                  exam.examType.charAt(0).toUpperCase() +
                  exam.examType.slice(1);

                return (
                  <div
                    key={exam._id}
                    className={`p-4 ${colors.bg} border-l-4 ${colors.border} rounded-r-lg`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-[#1a202c]">{exam.title}</p>
                        <p className="text-sm text-[#718096]">
                          {exam.teacher?.name} {exam.teacher?.surname}
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
                    <div className="flex gap-4 text-sm text-[#718096]">
                      <span>📅 {formatDate(exam.date)}</span>
                      <span>⏱️ {exam.duration} dakika</span>
                      <span className={colors.text}>📝 {examTypeLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Grades (1 Column) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a202c]">Son Notlar</h2>
            <Link
              href="/student/grades"
              className="text-[#667eea] font-semibold text-sm hover:underline"
            >
              Detay →
            </Link>
          </div>
          {recentGrades.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Henüz notunuz bulunmamaktadır.
            </div>
          ) : (
            <div className="space-y-4">
              {recentGrades.map((grade) => {
                if (!grade.exam || grade.score === null) return null;
                const colors = getGradeColor(grade.score);
                const examTypeLabel =
                  grade.exam.examType.charAt(0).toUpperCase() +
                  grade.exam.examType.slice(1);

                return (
                  <div
                    key={grade._id || grade.exam._id}
                    className={`p-4 ${colors.bg} rounded-lg flex justify-between items-center`}
                  >
                    <div>
                      <p className="font-bold text-[#1a202c]">
                        {grade.course.name}
                      </p>
                      <p className="text-xs text-[#718096]">
                        {examTypeLabel} - {grade.exam.title}
                      </p>
                    </div>
                    <span className={`text-2xl font-bold ${colors.text}`}>
                      {grade.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* My Courses */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1a202c]">Derslerim</h2>
          <Link
            href="/student/courses"
            className="text-[#667eea] font-semibold text-sm hover:underline"
          >
            Tümünü Gör →
          </Link>
        </div>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz ders kaydınız bulunmamaktadır.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <div
                key={course._id}
                className="p-4 bg-[#f7fafc] rounded-lg border border-gray-200 hover:border-[#667eea] transition-colors"
              >
                <p className="font-bold text-[#1a202c] mb-1">{course.name}</p>
                <p className="text-xs text-[#718096] mb-2">
                  {course.courseCode}
                </p>
                <p className="text-sm text-[#667eea]">
                  👨‍🏫 {course.teacher?.name} {course.teacher?.surname}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
