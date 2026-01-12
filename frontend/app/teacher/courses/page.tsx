"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/courses/teacher/my-courses",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setCourses(data);
    };
    fetchCourses();
  }, []);

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
        Verdiğim Dersler
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <div
            key={course._id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform"
          >
            <div className="text-3xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-[#1a202c] mb-2">
              {course.name}
            </h3>
            <p className="text-gray-500 mb-4">{course.courseCode}</p>
            <Link
              href={`/teacher/courses/${course._id}`}
              className="block text-center w-full py-2 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold"
            >
              Derse Git / Yönet
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
