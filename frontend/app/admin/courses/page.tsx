"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Tipler (Normalde types/index.ts içinde olması önerilir)
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
  teacher: UserProfile | null;
  students: UserProfile[];
  lessonNumber: number;
  status: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // SİMÜLASYON: Backend'den dersleri çekiyoruz
    const mockCourses: Course[] = [
      {
        _id: "c1",
        name: "Veri Yapıları",
        teacher: {
          _id: "t1",
          name: "Mehmet",
          surname: "Demir",
          role: "teacher",
          email: "mehmet@okul.com",
        },
        students: [
          {
            _id: "s1",
            name: "Ali",
            surname: "Yılmaz",
            role: "student",
            email: "ali@okul.com",
          },
          {
            _id: "s2",
            name: "Veli",
            surname: "Can",
            role: "student",
            email: "veli@okul.com",
          },
        ],
        lessonNumber: 101,
        status: "Aktif",
      },
    ];
    setCourses(mockCourses);
  }, []);

  return (
    <div className="animate-fadeIn p-6 min-h-screen bg-gray-50/50">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c]">Ders Yönetimi</h1>
          <p className="text-gray-500 mt-1">
            Dersleri, öğretmenleri ve öğrencileri tek yerden yönetin.
          </p>
        </div>

        {/* Yeni Ekle Butonu -> Link'e dönüştü */}
        <Link
          href="/admin/courses/create"
          className="px-6 py-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Yeni Ders Ekle
        </Link>
      </div>

      {/* Ders Listesi Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-[#667eea] to-[#764ba2]"></div>

            <div className="flex justify-between items-start mb-4 pl-3">
              <div>
                <h3 className="text-xl font-bold text-[#1a202c]">
                  {course.name}
                </h3>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Kod: {course.lessonNumber}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.status === "Aktif"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {course.status}
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

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {course.students?.length || 0}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Öğrenci Sayısı
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {course.students?.length} Öğrenci Kayıtlı
                  </p>
                </div>
              </div>
            </div>

            <div className="pl-3 mt-6 flex gap-3">
              {/* Düzenle Butonu -> Link'e dönüştü */}
              <Link
                href={`/admin/courses/${course._id}`}
                className="flex-1 bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200 text-center flex items-center justify-center"
              >
                Düzenle
              </Link>
              <button className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-100">
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
