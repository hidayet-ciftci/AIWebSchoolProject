"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { profile: user, loading }: any = useProfile();

  const [exam, setExam] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [examMeta, setExamMeta] = useState({
    title: "",
    date: "",
    time: "",
    duration: 0,
    weight: 0,
  });

  const [questions, setQuestions] = useState<any[]>([]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  });

  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;
    if (loading) return;
    if (!user) return;

    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/exams/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Sınav bulunamadı");
        return res.json();
      })
      .then((data) => {
        setExam(data);
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }

        const d = new Date(data.date);
        const dateStr = d.toISOString().split("T")[0];
        const timeStr = d.toTimeString().slice(0, 5);

        setExamMeta({
          title: data.title,
          date: dateStr,
          time: timeStr,
          duration: data.duration,
          weight: data.weight || 0,
        });

        setPageLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setPageLoading(false);
      });
  }, [id, user, loading]);

  const handleAddOrUpdateQuestion = () => {
    if (!newQuestion.questionText) return alert("Soru metni boş olamaz.");

    if (newQuestion.questionType === "multiple_choice") {
      if (newQuestion.options.some((o) => o.trim() === ""))
        return alert("Tüm şıkları doldurun.");
      if (!newQuestion.correctAnswer) return alert("Doğru şıkkı seçin.");
    } else {
      if (!newQuestion.correctAnswer) return alert("Beklenen cevabı girin.");
    }

    if (editingIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = newQuestion;
      setQuestions(updatedQuestions);
      setEditingIndex(null);
      alert("Soru güncellendi.");
    } else {
      setQuestions([...questions, newQuestion]);
    }

    setNewQuestion({
      questionText: "",
      questionType: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewQuestion({
        questionText: "",
        questionType: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 10,
      });
    }

    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleEditClick = (index: number) => {
    const questionToEdit = questions[index];
    setNewQuestion({ ...questionToEdit });
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewQuestion({
      questionText: "",
      questionType: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
  };

  const handleSaveChanges = async () => {
    if (totalPoints > 100) {
      return alert(
        `Kaydetmek için soruların toplam puanı 100'ü geçmemelidir.\nŞu anki toplam: ${totalPoints}`,
      );
    }

    const fullDate = new Date(`${examMeta.date}T${examMeta.time}:00`);

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
            title: examMeta.title,
            date: fullDate,
            duration: Number(examMeta.duration),
            weight: Number(examMeta.weight),
            questions: questions,
          }),
        },
      );

      if (res.ok) {
        setExam((prev: any) => ({ ...prev, title: examMeta.title }));
        alert("Sınav bilgileri ve sorular başarıyla kaydedildi!");
      } else {
        alert("Kaydederken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    }
  };

  const handlePublish = async () => {
    if (totalPoints !== 100) {
      return alert(
        `Yayınlamak için soruların toplam puanı tam 100 olmalıdır.\nŞu anki toplam: ${totalPoints}`,
      );
    }

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
        },
      );
      if (res.ok) {
        setExam({ ...exam, isPublished: true });
        alert("Sınav yayına alındı!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnpublish = async () => {
    if (
      !confirm(
        "Sınav yayından kaldırılacak. Öğrenciler artık bu sınavı göremeyecek. Emin misiniz?",
      )
    )
      return;

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
          body: JSON.stringify({ isPublished: false }),
        },
      );
      if (res.ok) {
        setExam({ ...exam, isPublished: false });
        alert("Sınav yayından kaldırıldı (Taslak moduna döndü).");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPointsBadgeStyle = () => {
    if (totalPoints === 100)
      return "bg-green-100 text-green-700 border-green-300";
    if (totalPoints < 100)
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  if (loading || pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!user)
    return <div className="p-10 text-center text-red-500">Giriş yapınız.</div>;
  if (!exam) return <div className="p-10 text-center">Sınav bulunamadı.</div>;

  return (
    <div className="animate-fadeIn p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {examMeta.title || exam.title}
          </h1>
          <p className="text-gray-500 mt-1">
            {exam.course?.name} ({exam.course?.courseCode})
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div
            className={`px-4 py-2 rounded font-bold border flex flex-col items-end text-sm ${getPointsBadgeStyle()}`}
          >
            <span>Toplam: {totalPoints} / 100</span>
            {totalPoints < 100 && (
              <span className="text-xs font-normal">
                Yayınlamak için 100 olmalı
              </span>
            )}
            {totalPoints > 100 && (
              <span className="text-xs font-normal">Maksimum 100 olmalı</span>
            )}
          </div>

          <button
            onClick={() => router.push("/teacher/exams")}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
          >
            Geri
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow"
          >
            Kaydet
          </button>

          {!exam.isPublished ? (
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold shadow"
            >
              Yayınla
            </button>
          ) : (
            <button
              onClick={handleUnpublish}
              className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 font-bold shadow transition-colors"
            >
              Yayından Kaldır 🚫
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">
          Genel Sınav Ayarları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Sınav Başlığı
            </label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={examMeta.title}
              onChange={(e) =>
                setExamMeta({ ...examMeta, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Tarih
            </label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={examMeta.date}
              onChange={(e) =>
                setExamMeta({ ...examMeta, date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Saat
            </label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={examMeta.time}
              onChange={(e) =>
                setExamMeta({ ...examMeta, time: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Süre (Dk)
              </label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={examMeta.duration}
                onChange={(e) =>
                  setExamMeta({
                    ...examMeta,
                    duration: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Etki (%)
              </label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={examMeta.weight}
                onChange={(e) =>
                  setExamMeta({
                    ...examMeta,
                    weight: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2 flex justify-between items-center">
            {editingIndex !== null ? "Soruyu Düzenle" : "Soru Ekle"}
            {editingIndex !== null && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Düzenleniyor: #{editingIndex + 1}
              </span>
            )}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Soru Metni</label>
              <textarea
                rows={3}
                className="w-full border rounded p-2"
                placeholder="Soru metni..."
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
                  <option value="multiple_choice">Test</option>
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

            {newQuestion.questionType === "text_input" && (
              <div>
                <label className="block text-sm font-bold mb-1">
                  Doğru Cevap Anahtarı
                </label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
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

            <div className="flex gap-2">
              {editingIndex !== null && (
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-2 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition shadow"
                >
                  İptal
                </button>
              )}
              <button
                onClick={handleAddOrUpdateQuestion}
                className={`flex-2 py-2 text-white rounded-lg font-bold transition shadow ${
                  editingIndex !== null
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {editingIndex !== null ? "Güncelle" : "+ Listeye Ekle"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex justify-between">
            <span>Sınav Soruları ({questions.length})</span>
          </h2>

          {questions.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 shadow-sm">
              Soru eklenmemiş.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className={`bg-white border rounded-lg p-5 shadow-sm relative group hover:shadow-md transition ${
                    editingIndex === idx
                      ? "border-yellow-400 ring-2 ring-yellow-100"
                      : "border-gray-200"
                  }`}
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
                              ? "Test"
                              : "Klasik"}
                          </span>
                        </div>

                        <div className="text-sm mt-2">
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

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleEditClick(idx)}
                        className="text-yellow-600 hover:text-yellow-700 font-bold px-2 py-1 transition-colors border border-yellow-200 rounded bg-yellow-50 text-xs"
                      >
                        ✏️ Düzenle
                      </button>

                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-red-400 hover:text-red-600 font-bold px-2 py-1 transition-colors border border-red-200 rounded bg-red-50 text-xs"
                      >
                        🗑️ Sil
                      </button>
                    </div>
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
