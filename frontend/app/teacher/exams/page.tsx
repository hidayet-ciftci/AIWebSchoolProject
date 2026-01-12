"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

export default function TeacherExamsPage() {
  const router = useRouter();

  // --- DÜZELTME BURADA YAPILDI ---
  // Hook'tan "profile" adıyla geliyor, biz bu sayfada "user" adıyla kullanmak istiyoruz.
  // Böylece aşağıda yazdığımız user._id kodlarını değiştirmemize gerek kalmıyor.
  // any kullanıyoruz çünkü TypeScript bazen null kontrolünde takılabiliyor.
  const { profile: user, loading }: any = useProfile();

  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Verileri
  const [formData, setFormData] = useState({
    courseId: "",
    examType: "vize",
    date: "",
    time: "10:00",
    duration: 45,
    weight: 30,
  });

  // 2. Verileri Çek
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Sadece user (aslında profile) yüklendiyse istek at
    if (!loading && user?._id) {
      // Dersleri Getir
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/courses/teacher/my-courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCourses(data);
        })
        .catch((err) => console.error("Ders hatası:", err));

      // Sınavları Getir
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/teacher/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setExams(data);
        })
        .catch((err) => console.error("Sınav hatası:", err));
    }
  }, [user, loading]);

  // 3. Sınav Oluşturma Fonksiyonu
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    // HATA AYIKLAMA: Konsola kullanıcı bilgisini yazdır
    console.log("Mevcut Kullanıcı (Profile):", user);

    if (!user?._id) {
      alert(
        "Kullanıcı bilgisi yüklenemedi. Lütfen sayfayı yenileyin veya tekrar giriş yapın."
      );
      return;
    }

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
            teacherId: user._id, // User ID buradan gidiyor
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Başarılıysa detay sayfasına git
        router.push(`/teacher/exams/${data.exam._id}`);
      } else {
        console.error("Backend Hatası:", data);
        alert(`Hata: ${data.message}`);
      }
    } catch (error) {
      console.error("Fetch Hatası:", error);
      alert("Sunucuya bağlanılamadı.");
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
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
      if (res.ok) setExams(exams.filter((e) => e._id !== examId));
    } catch (err) {
      console.error(err);
    }
  };

  // 4. EĞER YÜKLENİYORSA BEKLET
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-600">
          Kullanıcı bilgileri yükleniyor...
        </div>
      </div>
    );
  }

  // 5. EĞER USER YOKSA
  if (!user) {
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        Giriş yapmanız gerekiyor veya profil alınamadı.
      </div>
    );
  }

  return (
    <div className="animate-fadeIn p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#1a202c]">Sınav Yönetimi</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#667eea] text-white rounded-lg font-semibold hover:bg-[#5a67d8] transition shadow-lg"
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
                  {exam.course?.name || "..."}
                </td>
                <td className="p-4 text-gray-600">
                  {new Date(exam.date).toLocaleDateString("tr-TR")}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => router.push(`/teacher/exams/${exam._id}`)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium mr-2"
                  >
                    Düzenle / Sorular
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam._id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Henüz hiç sınav oluşturmadınız.
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl mt-80">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Yeni Sınav Oluştur
            </h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ders Seçin
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2.5 bg-white"
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                >
                  <option value="">Seçiniz...</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.courseCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Sınav Tipi
                  </label>
                  <select
                    className="w-full border rounded-lg p-2.5 bg-white"
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
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Tarih
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full border rounded-lg p-2.5 bg-white"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sınav Saati
                  </label>
                  <input
                    type="time"
                    name="time"
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Süre (Dk)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2.5 bg-white"
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
                  <label className="block text-sm font-semibold mb-1">
                    Etki (%)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2.5 bg-white"
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

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5a67d8] font-bold"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
