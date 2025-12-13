"use client";

import { useEffect, useState } from "react";

export default function AdminCoursesPage() {
  // Gerçek projede burası API'den çekilmeli
  const courses = [
    { id: 1, name: "Veri Yapıları", teacher: "Mehmet Demir", students: 45 },
    { id: 2, name: "Yapay Zeka", teacher: "Ayşe Kara", students: 32 },
    { id: 3, name: "Web Programlama", teacher: "Can Yıldız", students: 28 },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#1a202c]">Ders Yönetimi</h1>
        <button className="px-6 py-2 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold hover:-translate-y-0.5 transition-transform">
          + Yeni Ders Ekle
        </button>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
          >
            <div>
              <h3 className="text-xl font-bold text-[#1a202c]">
                {course.name}
              </h3>
              <p className="text-gray-500">Öğretmen: {course.teacher}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                {course.students} Öğrenci
              </span>
              <button className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                Sil
              </button>
              <button className="text-[#667eea] hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors">
                Düzenle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
