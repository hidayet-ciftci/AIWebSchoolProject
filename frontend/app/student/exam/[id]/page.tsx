"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

// Tip tanımlamaları (backend'den gelen veriye göre)
interface Question {
  _id: string;
  questionText: string;
  questionType: "multiple_choice" | "text_input";
  options?: string[];
  points: number;
}

interface ExamData {
  _id: string;
  title: string;
  course: { name: string };
  questions: Question[];
  remainingTime: number; // Backend'den ms cinsinden gelecek
}

export default function TakeExamPage() {
  const params = useParams(); // URL'deki ID'yi alır
  const router = useRouter();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Geri sayım için state
  const [timeLeft, setTimeLeft] = useState<number>(0); // saniye cinsinden tutalım
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Öğrencinin verdiği cevapları tutacak obje { soruId: "Cevap" }
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/exams/student/take/${params.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Sınava erişilemedi");
        }

        const data = await res.json();
        setExam(data);

        // Backend'den gelen kalan süreyi (ms) saniyeye çevir
        setTimeLeft(Math.floor(data.remainingTime / 1000));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [params.id, router]);

  // Sayaç Mantığı
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishExam(true); // Süre bitti, otomatik bitir
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  // Saniyeyi Dakika:Saniye formatına çevir
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Cevap işaretleme fonksiyonu
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Sınavı Bitir Butonu
  const handleFinishExam = async (isAuto: boolean = false) => {
    if (isAuto) {
      alert("Süre doldu! Sınavınız otomatik olarak sonlandırılıyor.");
    } else {
      const confirmFinish = confirm(
        "Sınavı bitirmek istediğinize emin misiniz?"
      );
      if (!confirmFinish) return;
    }

    // TODO: Burada Backend'e cevapları POST etme kodu olacak.
    // Şimdilik sadece console'a yazıp yönlendiriyoruz.
    console.log("Gönderilecek Cevaplar:", answers);

    /* İleride eklenecek kod:
       await fetch('/api/exams/submit', { 
         method: 'POST', 
         body: JSON.stringify({ examId: exam._id, answers }) 
       });
    */

    router.push("/student/exam");
  };

  if (loading)
    return <div className="p-10 text-center">Sınav yükleniyor...</div>;
  if (error)
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        {error} <br />{" "}
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-500 underline"
        >
          Geri Dön
        </button>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Üst Bilgi Çubuğu (Sticky) */}
      <div className="sticky top-0 z-10 bg-white shadow-md p-4 rounded-b-xl flex justify-between items-center mb-6 border-t-4 border-blue-600">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{exam?.title}</h1>
          <p className="text-sm text-gray-500">{exam?.course.name}</p>
        </div>
        <div
          className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${
            timeLeft < 300
              ? "bg-red-100 text-red-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Sorular Alanı */}
      <div className="space-y-6">
        {exam?.questions.map((q, index) => (
          <div
            key={q._id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Soru {index + 1}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {q.points} Puan
              </span>
            </div>

            <p className="mb-6 text-gray-700 whitespace-pre-wrap">
              {q.questionText}
            </p>

            {/* Soru Tipine Göre Input */}
            {q.questionType === "multiple_choice" ? (
              <div className="space-y-3">
                {q.options?.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-blue-50 ${
                      answers[q._id] === option
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q._id}`}
                      value={option}
                      checked={answers[q._id] === option}
                      onChange={(e) =>
                        handleAnswerChange(q._id, e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Cevabınızı buraya yazınız..."
                value={answers[q._id] || ""}
                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Sınavı Bitir Butonu */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => handleFinishExam(false)}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg transition-transform hover:scale-105"
        >
          Sınavı Tamamla
        </button>
      </div>
    </div>
  );
}
