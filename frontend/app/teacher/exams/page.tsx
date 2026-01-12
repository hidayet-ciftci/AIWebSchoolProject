"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile"; // Profil bilgisini buradan alıyoruz

export default function TeacherExamsPage() {
  const router = useRouter();
  const { user }: any = useProfile(); // Giriş yapmış öğretmenin bilgileri
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Modal ve Form State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    examType: "vize",
    date: "",
    duration: 45,
    weight: 30,
  });

  // 1. Öğretmenin Sınavlarını ve Derslerini Çek
  useEffect(() => {
    if (!user?._id) return;

    // Sınavları Çek
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/exams/teacher/${user._id}`
    )
      .then((res) => res.json())
      .then((data) => setExams(data))
      .catch((err) => console.error("Sınavlar yüklenemedi:", err));

    // Dersleri Çek (Select kutusu için gerekli)
    // Not: Eğer /api/courses/teacher/:id rotan yoksa, bunu backend'e eklemen gerekebilir.
    // Şimdilik varsayılan /api/courses rotasını deniyoruz veya senin rotana göre düzenle.
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/courses/teacher/${user._id}`
    )
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch((err) => console.error("Dersler yüklenemedi:", err));
  }, [user]);

  // 2. Sınav Oluşturma İşlemi
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            teacherId: user._id, // Öğretmen ID'sini ekliyoruz
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Başarılıysa detay sayfasına yönlendir (Soru eklemek için)
        router.push(`/teacher/exams/${data.exam._id}`);
      } else {
        alert("Hata: " + data.message);
      }
    } catch (error) {
      console.error("Sınav oluşturma hatası:", error);
    }
  };

  return (
    <div className="animate-fadeIn p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#1a202c]">Sınav Yönetimi</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#667eea] text-white rounded-lg font-semibold hover:bg-[#5a67d8] transition"
        >
          + Yeni Sınav Oluştur
        </button>
      </div>

      {/* Sınav Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-bold border-b">
            <tr>
              <th className="p-4">Sınav Adı</th>
              <th className="p-4">Ders</th>
              <th className="p-4">Tarih</th>
              <th className="p-4">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-[#1a202c]">
                  {exam.title}
                </td>
                <td className="p-4 text-gray-600">
                  {exam.course?.name || "Bilinmiyor"}
                </td>
                <td className="p-4 text-gray-600">
                  {new Date(exam.date).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => router.push(`/teacher/exams/${exam._id}`)}
                    className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 mr-2"
                  >
                    Soruları Düzenle
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Silmek istediğine emin misin?")) {
                        await fetch(
                          `${
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:5000"
                          }/api/exams/${exam._id}`,
                          { method: "DELETE" }
                        );
                        setExams(exams.filter((e) => e._id !== exam._id));
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Henüz sınav oluşturulmamış.
          </div>
        )}
      </div>

      {/* MODAL: Yeni Sınav Oluştur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Yeni Sınav Oluştur</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sınav Başlığı
                </label>
                <input
                  required
                  type="text"
                  className="w-full border rounded p-2"
                  placeholder="Örn: Veri Yapıları Vize"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Ders Seçin
                </label>
                <select
                  required
                  className="w-full border rounded p-2"
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                >
                  <option value="">Seçiniz...</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.courseCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tarih
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full border rounded p-2"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sınav Tipi
                  </label>
                  <select
                    className="w-full border rounded p-2"
                    value={formData.examType}
                    onChange={(e) =>
                      setFormData({ ...formData, examType: e.target.value })
                    }
                  >
                    <option value="vize">Vize</option>
                    <option value="quiz">Quiz</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Süre (Dk)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Etki Oranı (%)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#667eea] text-white rounded hover:bg-[#5a67d8]"
                >
                  Oluştur ve Devam Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
