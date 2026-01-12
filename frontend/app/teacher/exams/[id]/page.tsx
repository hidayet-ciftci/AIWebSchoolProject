"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

export default function ExamDetailPage() {
  const { id } = useParams(); // URL'deki sınav ID'sini al
  const router = useRouter();

  // --- DÜZELTME: Hook'tan gelen 'profile'ı 'user' ismiyle alıyoruz ---
  const { profile: user, loading }: any = useProfile();

  const [exam, setExam] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true); // Sayfa içi veri yükleme durumu

  // --- SORU EKLEME STATE'LERİ ---
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  });

  // 1. SINAV DETAYLARINI ÇEK
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;

    // Kullanıcı yükleniyorsa bekle, yüklendiyse ve user yoksa dur
    if (loading) return;
    if (!user) return;

    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/exams/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Sınav bulunamadı");
        return res.json();
      })
      .then((data) => {
        setExam(data);
        // Eğer veritabanında kayıtlı sorular varsa onları da state'e at
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
        setPageLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setPageLoading(false);
      });
  }, [id, user, loading]);

  // 2. LİSTEYE GEÇİCİ SORU EKLEME
  const handleAddQuestionToList = () => {
    // Basit Validasyon
    if (!newQuestion.questionText) return alert("Soru metni boş olamaz.");
    if (newQuestion.questionType === "multiple_choice") {
      if (newQuestion.options.some((o) => o.trim() === ""))
        return alert("Tüm şıkları doldurun.");
      if (!newQuestion.correctAnswer) return alert("Doğru şıkkı seçin.");
    } else {
      if (!newQuestion.correctAnswer) return alert("Beklenen cevabı girin.");
    }

    // Listeye ekle
    setQuestions([...questions, newQuestion]);

    // Formu temizle
    setNewQuestion({
      questionText: "",
      questionType: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
  };

  // 3. SORU SİLME (Listeden)
  const handleRemoveQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  // 4. DEĞİŞİKLİKLERİ KAYDET (Veritabanına Gönder)
  const handleSaveChanges = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questions: questions, // Güncel soru listesini gönderiyoruz
          }),
        }
      );

      if (res.ok) {
        alert("Sorular ve değişiklikler başarıyla kaydedildi!");
      } else {
        alert("Kaydederken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    }
  };

  // 5. SINAVI YAYINLA (Öğrencilere Görünür Yap)
  const handlePublish = async () => {
    if (!confirm("Sınav yayınlanacak. Emin misiniz?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/exams/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isPublished: true }),
        }
      );
      if (res.ok) {
        setExam({ ...exam, isPublished: true });
        alert("Sınav yayına alındı!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- RENDER KONTROLLERİ ---

  if (loading || pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-red-500">
        Giriş yapmanız gerekiyor.
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-10 text-center">
        Sınav bulunamadı veya yetkiniz yok.
      </div>
    );
  }

  return (
    <div className="animate-fadeIn p-6 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{exam.title}</h1>
          <p className="text-gray-500 mt-1">
            {exam.course?.name} ({exam.course?.courseCode}) |{" "}
            {new Date(exam.date).toLocaleDateString("tr-TR")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/teacher/exams")}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
          >
            Geri Dön
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow"
          >
            Tümünü Kaydet
          </button>
          {!exam.isPublished ? (
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold shadow"
            >
              Yayınla
            </button>
          ) : (
            <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded font-bold cursor-not-allowed">
              Yayında
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SOL KOLON: SORU EKLEME FORMU */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
            Soru Ekle
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Soru Metni</label>
              <textarea
                rows={3}
                className="w-full border rounded p-2"
                placeholder="Örn: Aşağıdakilerden hangisi..."
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
                <label className="block text-sm font-bold mb-1">Tip</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={newQuestion.questionType}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      questionType: e.target.value,
                    })
                  }
                >
                  <option value="multiple_choice">Test (Şıklı)</option>
                  <option value="text_input">Klasik</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-sm font-bold mb-1">Puan</label>
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

            {/* ŞIKLAR ALANI (Sadece test ise görünür) */}
            {newQuestion.questionType === "multiple_choice" && (
              <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase">
                  Şıklar & Doğru Cevap
                </p>
                {["A", "B", "C", "D"].map((optLabel, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-bold w-4 text-sm">{optLabel}</span>
                    <input
                      type="text"
                      className="flex-1 border rounded p-1 text-sm"
                      placeholder={`Seçenek ${optLabel}`}
                      value={newQuestion.options[idx]}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOpts });
                      }}
                    />
                    <input
                      type="radio"
                      name="correct"
                      checked={newQuestion.correctAnswer === optLabel}
                      onChange={() =>
                        setNewQuestion({
                          ...newQuestion,
                          correctAnswer: optLabel,
                        })
                      }
                      className="cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* KLASİK CEVAP ALANI */}
            {newQuestion.questionType === "text_input" && (
              <div>
                <label className="block text-sm font-bold mb-1">
                  Doğru Cevap Anahtarı
                </label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  placeholder="Beklenen cevap..."
                  value={newQuestion.correctAnswer}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      correctAnswer: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <button
              onClick={handleAddQuestionToList}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow"
            >
              + Listeye Ekle
            </button>
          </div>
        </div>

        {/* SAĞ KOLON: SORU LİSTESİ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            Sınav Soruları ({questions.length})
          </h2>

          {questions.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 shadow-sm">
              Henüz bu sınava hiç soru eklenmemiş. <br />
              Soldaki formu kullanarak soru ekleyebilirsin.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded-lg p-5 shadow-sm relative group hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 w-full">
                      <span className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-lg text-sm h-fit">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg mb-2">
                          {q.questionText}
                        </p>
                        <div className="flex gap-3 text-sm text-gray-600 mb-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">
                            {q.points} Puan
                          </span>
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                            {q.questionType === "multiple_choice"
                              ? "Çoktan Seçmeli"
                              : "Klasik"}
                          </span>
                        </div>

                        {/* Cevap Detayı */}
                        <div className="text-sm">
                          {q.questionType === "multiple_choice" ? (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options?.map((opt: string, i: number) => {
                                const label = ["A", "B", "C", "D"][i];
                                const isCorrect = label === q.correctAnswer;
                                return (
                                  <li
                                    key={i}
                                    className={`px-3 py-2 rounded border flex items-center gap-2 ${
                                      isCorrect
                                        ? "bg-green-50 border-green-200 text-green-700 font-bold"
                                        : "bg-gray-50 border-gray-100 text-gray-600"
                                    }`}
                                  >
                                    <span className="w-5">{label})</span>
                                    <span>{opt}</span>
                                    {isCorrect && (
                                      <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                                        Doğru
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="p-3 bg-green-50 rounded border border-green-100">
                              <span className="font-bold text-green-800">
                                Doğru Cevap:
                              </span>{" "}
                              <span className="text-green-700">
                                {q.correctAnswer}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="ml-4 text-red-400 hover:text-red-600 font-bold px-2 py-1 transition-colors"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
