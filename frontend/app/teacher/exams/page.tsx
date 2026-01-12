"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

export default function TeacherExamsPage() {
  const router = useRouter();
  const { user }: any = useProfile();
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    courseId: "",
    examType: "vize",
    date: "",
    duration: 45,
    weight: 30,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // --- DÜZELTİLEN KISIM BURASI ---
    // Backend'de zaten var olan "/teacher/my-courses" rotasını kullanıyoruz.
    // Böylece backend koduna dokunmana gerek kalmıyor.
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/courses/teacher/my-courses`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Dersler çekilemedi");
        return res.json();
      })
      .then((data) => {
        // Gelen veri array mi kontrol et, değilse boş array yap
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          console.error("Ders verisi dizi formatında gelmedi:", data);
          setCourses([]);
        }
      })
      .catch((err) => console.error("Ders yükleme hatası:", err));
    // -------------------------------

    // Sınavları getir (Burada da user._id kullanıyorduk, o çalışıyordu)
    if (user?._id) {
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/teacher/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setExams(data);
        })
        .catch((err) => console.error("Sınavlar yüklenemedi:", err));
    }
  }, [user]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            teacherId: user._id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        router.push(`/teacher/exams/${data.exam._id}`);
      } else {
        alert("Hata: " + data.message);
      }
    } catch (error) {
      console.error("Sınav oluşturma hatası:", error);
      alert("Bir hata oluştu.");
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Bu sınavı silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/${examId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setExams(exams.filter((e) => e._id !== examId));
      } else {
        alert("Silme işlemi başarısız oldu.");
      }
    } catch (error) {
      console.error("Silme hatası:", error);
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
                  {new Date(exam.date).toLocaleDateString("tr-TR")}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => router.push(`/teacher/exams/${exam._id}`)}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 mr-2"
                  >
                    Düzenle / Sorular
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam._id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Yeni Sınav Oluştur</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
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
