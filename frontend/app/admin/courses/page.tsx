"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
  _id: string;
  name: string;
  surname: string;
  role: string;
  email: string;
}

interface Course {
  _id: string;
  name: string;
  courseCode: string; // YENİ
  teacher: UserProfile | null;
  students: UserProfile[];
  lessonNumber: number; // YENİ
  status: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/courses");
      if (!res.ok) throw new Error("Veriler çekilemedi");
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      console.error("Hata:", error);
      alert("Dersler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu dersi silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/courses/delete/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        alert("Ders başarıyla silindi");
        setCourses((prev) => prev.filter((course) => course._id !== id));
      } else {
        alert("Silme işlemi başarısız oldu.");
      }
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  if (loading) return <div className="p-6">Yükleniyor...</div>;

  return (
    <div className="animate-fadeIn p-6 min-h-screen bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c]">Ders Yönetimi</h1>
          <p className="text-gray-500 mt-1">
            Dersleri, öğretmenleri ve öğrencileri tek yerden yönetin.
          </p>
        </div>

        <Link
          href="/admin/courses/create"
          className="px-6 py-3 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Yeni Ders Ekle
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#667eea] to-[#764ba2]"></div>

            <div className="flex justify-between items-start mb-4 pl-3">
              <div>
                <h3 className="text-xl font-bold text-[#1a202c]">
                  {course.name}
                </h3>
                {/* Ders Kodu Gösterimi */}
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-1 rounded-md mt-1 inline-block">
                  {course.courseCode || "KOD YOK"}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {course.status || "Aktif"}
              </span>
            </div>

            <div className="pl-3 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">
                  {course.teacher?.name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Öğretmen
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {course.teacher
                      ? `${course.teacher.name} ${course.teacher.surname}`
                      : "Atanmadı"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pr-2">
                {/* Öğrenci Sayısı */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {course.students?.length || 0}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">
                      Öğrenci
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {course.students?.length} Kayıtlı
                    </p>
                  </div>
                </div>

                {/* Ders Sayısı Gösterimi */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Ders Sayısı
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {course.lessonNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="pl-3 mt-6 flex gap-3">
              <Link
                href={`/admin/courses/${course._id}`}
                className="flex-1 bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200 text-center flex items-center justify-center"
              >
                Düzenle
              </Link>
              <button
                onClick={() => handleDelete(course._id)}
                className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-100"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
