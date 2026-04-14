"use client";
import { useState, useEffect, use, useCallback } from "react";

type CourseMaterial = {
  _id: string;
  title: string;
  fileUrl: string;
  status?: string;
};

type CourseDetail = {
  name: string;
  materials?: CourseMaterial[];
};

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const getStatusMeta = (status?: string) => {
    switch (status) {
      case "ready":
        return {
          label: "Hazır",
          className: "bg-green-100 text-green-700",
        };
      case "processing":
        return {
          label: "İşleniyor",
          className: "bg-blue-100 text-blue-700",
        };
      case "failed":
        return {
          label: "Hata",
          className: "bg-red-100 text-red-700",
        };
      default:
        return {
          label: "Hazırlanıyor",
          className: "bg-yellow-100 text-yellow-700",
        };
    }
  };

  const fetchCourse = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCourse(data);
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCourse();
    });
  }, [fetchCourse]);

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

    alert("Dosya yüklendi ve RAG indeksleme kuyruğuna alındı!");
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
      },
    );
    fetchCourse();
  };

  if (!course) return <div>Yükleniyor...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{course.name} - Detaylar</h1>

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
        <p className="text-sm text-gray-500 mt-3">
          Yüklenen materyaller arka planda işlenir. Durum bilgisini aşağıdaki
          listeden takip edebilirsiniz.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Ders Materyalleri</h2>
        {course.materials?.length === 0 ? (
          <p>Henüz materyal yüklenmemiş.</p>
        ) : (
          <ul className="space-y-3">
            {course.materials?.map((mat: CourseMaterial) => (
              <li
                key={mat._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="flex items-center gap-3">
                  <a
                    href={`http://localhost:5000${mat.fileUrl}`}
                    target="_blank"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    📄 {mat.title}
                  </a>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusMeta(mat.status).className}`}
                  >
                    {getStatusMeta(mat.status).label}
                  </span>
                </div>
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
