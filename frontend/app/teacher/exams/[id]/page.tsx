"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Exam, Question } from "@/types"; // Bu type'ları önceki adımda oluşturmuştuk

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  // Yeni Soru Formu State'i
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    questionText: "",
    questionType: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  });

  // 1. Sınav Verisini Çek
  useEffect(() => {
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/exams/${id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setExam(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, [id]);

  // 2. Yeni Soru Ekle (Local State'e)
  const handleAddQuestion = () => {
    if (!exam) return;
    if (!newQuestion.questionText || !newQuestion.correctAnswer) {
      alert("Lütfen soru metnini ve doğru cevabı giriniz.");
      return;
    }

    const updatedQuestions = [...exam.questions, newQuestion as Question];
    setExam({ ...exam, questions: updatedQuestions });

    // Formu sıfırla
    setNewQuestion({
      questionText: "",
      questionType: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
  };

  // 3. Soruyu Sil (Local State'den)
  const handleDeleteQuestion = (index: number) => {
    if (!exam) return;
    const updatedQuestions = exam.questions.filter((_, i) => i !== index);
    setExam({ ...exam, questions: updatedQuestions });
  };

  // 4. Değişiklikleri Kaydet (Backend'e PUT İsteği)
  const handleSaveChanges = async () => {
    if (!exam) return;
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(exam),
        }
      );

      if (response.ok) {
        alert("Sınav ve sorular başarıyla kaydedildi!");
        router.push("/teacher/exams"); // Listeye geri dön
      } else {
        alert("Kaydederken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    }
  };

  if (loading) return <div className="p-6">Yükleniyor...</div>;
  if (!exam) return <div className="p-6">Sınav bulunamadı.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Üst Bilgi Kartı */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
          <p className="text-gray-500">
            {(exam.course as any)?.name} •{" "}
            {new Date(exam.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/teacher/exams")}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            İptal / Geri
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow-md transition-transform transform hover:-translate-y-0.5"
          >
            Tüm Değişiklikleri Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL KOLON: Soru Ekleme Formu */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 sticky top-4">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">
              Yeni Soru Ekle
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Soru Metni
                </label>
                <textarea
                  className="w-full border rounded p-2 text-sm min-h-[80px]"
                  placeholder="Soruyu buraya yazın..."
                  value={newQuestion.questionText}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      questionText: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Tip
                  </label>
                  <select
                    className="w-full border rounded p-2 text-sm"
                    value={newQuestion.questionType}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        questionType: e.target.value as any,
                      })
                    }
                  >
                    <option value="multiple_choice">Çoktan Seçmeli</option>
                    <option value="text_input">Klasik</option>
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-sm font-medium text-gray-700">
                    Puan
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 text-sm"
                    value={newQuestion.points}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        points: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Şıklar Sadece Çoktan Seçmeliyse Görünür */}
              {newQuestion.questionType === "multiple_choice" && (
                <div className="space-y-2 bg-gray-50 p-3 rounded">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Seçenekler
                  </label>
                  {newQuestion.options?.map((opt, idx) => (
                    <input
                      key={idx}
                      placeholder={`${String.fromCharCode(65 + idx)}) Seçenek`}
                      className="w-full border rounded p-2 text-sm"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(newQuestion.options || [])];
                        newOpts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOpts });
                      }}
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Doğru Cevap
                </label>
                <input
                  className="w-full border border-green-300 bg-green-50 rounded p-2 text-sm"
                  placeholder={
                    newQuestion.questionType === "multiple_choice"
                      ? "Örn: Seçenek metninin aynısı"
                      : "Cevap anahtarı..."
                  }
                  value={newQuestion.correctAnswer}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      correctAnswer: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Not: Çoktan seçmeli ise şıktaki metnin aynısını yapıştırın.
                </p>
              </div>

              <button
                onClick={handleAddQuestion}
                className="w-full py-2 bg-[#667eea] text-white rounded font-semibold hover:bg-[#5a67d8] transition"
              >
                Listeye Ekle
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: Eklenen Soruların Listesi */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            Soru Listesi ({exam.questions.length})
          </h2>

          {exam.questions.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
              Henüz soru eklenmemiş. Soldaki formu kullanın.
            </div>
          )}

          {exam.questions.map((q, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-[#1a202c]">Soru {i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                    {q.points} Puan
                  </span>
                  <button
                    onClick={() => handleDeleteQuestion(i)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                    title="Sil"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-gray-800 mb-3">{q.questionText}</p>

              {q.questionType === "multiple_choice" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {q.options?.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm border ${
                        opt === q.correctAnswer
                          ? "bg-green-50 border-green-200 text-green-800 font-medium"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)} {opt}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-500 border-t pt-2 mt-2">
                <span className="font-semibold">Doğru Cevap:</span>{" "}
                {q.correctAnswer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
