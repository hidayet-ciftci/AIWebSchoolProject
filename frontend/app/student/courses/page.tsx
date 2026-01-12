"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Backend'den öğrencinin derslerini çekiyoruz
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "http://localhost:5000/api/courses/student/my-courses",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setCourses(data);
      } catch (error) {
        console.error("Hata:", error);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Derslerim</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <div
            key={course._id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform duration-300"
          >
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-[#1a202c] mb-2">
              {course.name}
            </h3>
            <p className="text-gray-500 mb-4">
              {course.teacher?.name} {course.teacher?.surname}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-[#667eea] font-semibold">
                {course.lessonNumber || 0} Ders
              </span>

              <Link
                href={`/student/courses/${course._id}`}
                className="bg-[#e6fffa] text-[#319795] px-4 py-2 rounded-lg font-bold hover:bg-[#b2f5ea]"
              >
                Ders Detayı
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
