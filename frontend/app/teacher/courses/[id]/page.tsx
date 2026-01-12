// frontend/app/teacher/courses/[id]/page.tsx
"use client";
import { useState, useEffect, use } from "react";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params promise olduğu için unwrap yapıyoruz
  const { id } = use(params);

  const [course, setCourse] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  // Ders verilerini çek
  const fetchCourse = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCourse(data);
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  // Dosya Yükleme Fonksiyonu
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/courses/${id}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    alert("Dosya yüklendi!");
    setFile(null);
    fetchCourse();
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Silmek istediğine emin misin?")) return;
    const token = localStorage.getItem("token");
    await fetch(
      `http://localhost:5000/api/courses/${id}/materials/${materialId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchCourse();
  };

  if (!course) return <div>Yükleniyor...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{course.name} - Detaylar</h1>

      {/* Dosya Yükleme Formu */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Yeni Materyal Ekle</h2>
        <form onSubmit={handleUpload} className="flex gap-4 items-center">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Yükle
          </button>
        </form>
      </div>

      {/* Yüklü Dosyalar Listesi */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Ders Materyalleri</h2>
        {course.materials?.length === 0 ? (
          <p>Henüz materyal yüklenmemiş.</p>
        ) : (
          <ul className="space-y-3">
            {course.materials?.map((mat: any) => (
              <li
                key={mat._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <a
                  href={`http://localhost:5000${mat.fileUrl}`}
                  target="_blank"
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  📄 {mat.title}
                </a>
                <button
                  onClick={() => handleDelete(mat._id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Sil 🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
