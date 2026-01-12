"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Exam } from "@/types"; // Types dosyanızdaki Exam interface'i

export default function ExamPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/exams/student/my-exams`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Backend 'User'ı buradan tanıyacak
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setExams(data);
        } else {
          console.error("Sınavlar çekilemedi");
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit", // Saati ekledik
      minute: "2-digit", // Dakikayı ekledik
    });
  };

  const getStatus = (examDate: string, duration: number) => {
    const now = new Date();
    const start = new Date(examDate);
    const end = new Date(start.getTime() + duration * 60000); // dk -> ms çevrimi

    if (now < start)
      return { label: "Yaklaşıyor", color: "bg-[#fef5e7] text-[#d97706]" };
    if (now >= start && now <= end)
      return { label: "Aktif", color: "bg-[#e6fffa] text-[#319795]" };
    return { label: "Tamamlandı", color: "bg-gray-100 text-gray-500" };
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Sınavlarım</h1>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-lg">
            Henüz atanmış aktif bir sınavınız bulunmamaktadır.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {/* Tablo Başlıkları */}
          <div className="hidden md:grid grid-cols-5 gap-4 pb-4 border-b border-gray-200 mb-4 font-bold text-gray-600">
            <div className="col-span-2">Ders & Sınav</div>
            <div>Tarih</div>
            <div>Süre</div>
            <div>Durum</div>
            <div className="text-right">İşlem</div>
          </div>

          {/* Sınav Listesi */}
          {exams.map((exam) => {
            const status = getStatus(exam.date, exam.duration);
            const courseName = (exam.course as any)?.name || "Ders Bilgisi Yok";

            return (
              <div
                key={exam._id}
                className="grid md:grid-cols-5 gap-4 items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-2">
                  <p className="font-semibold text-[#1a202c]">{exam.title}</p>
                  <p className="text-sm text-gray-500">{courseName}</p>
                </div>

                <div className="text-[#1a202c]">
                  <span className="md:hidden font-bold">Tarih: </span>
                  {formatDate(exam.date)}
                </div>

                <div className="text-[#1a202c]">
                  <span className="md:hidden font-bold">Süre: </span>
                  {exam.duration} dk
                </div>

                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Buton Alanı */}
                <div className="text-right">
                  {exam.isCompleted ? (
                    <span className="text-sm text-green-600 font-semibold">
                      Tamamlandı
                    </span>
                  ) : status.label === "Aktif" ? (
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm transition shadow-sm"
                      onClick={() => router.push(`/student/exam/${exam._id}`)}
                    >
                      Sınava Gir
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400 italic">
                      {status.label === "Yaklaşıyor"
                        ? "Zamanı Gelmedi"
                        : "Süre Doldu"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
