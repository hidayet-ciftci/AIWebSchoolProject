"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Ders bulunamadı");
        }

        const data = await res.json();
        setCourse(data);
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) return <div className="p-6 text-center">Yükleniyor...</div>;
  if (!course)
    return (
      <div className="p-6 text-center text-red-500">
        Ders bulunamadı veya erişim yetkiniz yok.
      </div>
    );

  return (
    <div className="animate-fadeIn p-6">
      <Link
        href="/student/courses"
        className="text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        ← Derslere Dön
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h1 className="text-3xl font-bold text-[#1a202c] mb-2">
          {course.name}
        </h1>
        <p className="text-gray-600">
          <span className="font-semibold">Öğretmen:</span>{" "}
          {course.teacher?.name} {course.teacher?.surname}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Ders Kodu:</span> {course.courseCode}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Ders Sayısı:</span>{" "}
          {course.lessonNumber}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#1a202c] mb-4 flex items-center gap-2">
          📁 Ders Materyalleri ve Notlar
        </h2>

        {course.materials && course.materials.length > 0 ? (
          <div className="grid gap-3">
            {course.materials.map((mat: any) => (
              <div
                key={mat._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-semibold text-gray-800">{mat.title}</p>
                    <p className="text-xs text-gray-500">
                      Yüklenme:{" "}
                      {new Date(mat.uploadedAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>

                <a
                  href={`http://localhost:5000${mat.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#319795] text-white rounded-md text-sm font-bold hover:bg-[#2c8a88] transition-colors"
                >
                  Görüntüle / İndir
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p>Henüz bu derse ait materyal yüklenmemiş.</p>
          </div>
        )}
      </div>
    </div>
  );
}
