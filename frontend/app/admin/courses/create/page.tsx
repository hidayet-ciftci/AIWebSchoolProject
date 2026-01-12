"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  _id: string;
  name: string;
  surname: string;
  role: string;
  studentNo?: number;
}

export default function CreateCoursePage() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    courseCode: "",
    lessonNumber: "",
    teacher: "",
    students: [] as string[],
    status: "Aktif",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users");
        if (res.ok) {
          const data: UserProfile[] = await res.json();
          setTeachers(data.filter((u) => u.role === "teacher"));
          setStudents(data.filter((u) => u.role === "student"));
        }
      } catch (error) {
        console.error("Kullanıcılar çekilemedi", error);
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleStudent = (studentId: string) => {
    const currentList = formData.students;
    if (currentList.includes(studentId)) {
      setFormData({
        ...formData,
        students: currentList.filter((id) => id !== studentId),
      });
    } else {
      setFormData({ ...formData, students: [...currentList, studentId] });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/courses/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Ders başarıyla oluşturuldu!");
        router.push("/admin/courses");
      } else {
        const errorData = await res.json();
        alert("Hata: " + (errorData.message || "Bilinmeyen bir hata"));
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex justify-center py-10 px-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-fit border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">
            Yeni Ders Oluştur
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ders kodu ve ders sayısını eksiksiz giriniz.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Üst Kısım: Ad, Kod ve Sayı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders Adı
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Örn: Algoritma ve Programlama"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders Kodu (Code)
              </label>
              <input
                type="text"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Örn: BSM101"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders Sayısı (Lesson Number)
              </label>
              <input
                type="number"
                name="lessonNumber"
                value={formData.lessonNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Örn: 14"
              />
            </div>
          </div>

          {/* Öğretmen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Öğretmen Ata
            </label>
            <select
              name="teacher"
              value={formData.teacher}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Öğretmen Seçiniz...</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} {t.surname}
                </option>
              ))}
            </select>
          </div>

          {/* Öğrenci Listesi */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Öğrencileri Seç
              </label>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                {formData.students.length} Seçili
              </span>
            </div>
            <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 divide-y divide-gray-100">
              {students.map((student) => {
                const isSelected = formData.students.includes(student._id);
                return (
                  <div
                    key={student._id}
                    onClick={() => toggleStudent(student._id)}
                    className={`flex items-center p-3 cursor-pointer transition-colors hover:bg-white ${
                      isSelected ? "bg-purple-50/50" : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                        isSelected
                          ? "bg-purple-600 border-purple-600"
                          : "border-gray-400 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm ${
                          isSelected
                            ? "font-semibold text-purple-900"
                            : "text-gray-700"
                        }`}
                      >
                        {student.name} {student.surname}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.studentNo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Durum
            </label>
            <div className="flex gap-4">
              {["Aktif", "Pasif", "Tamamlandı"].map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#667eea] text-white font-medium rounded-lg hover:bg-[#5a6fd6] shadow-md"
          >
            {isLoading ? "Kaydediliyor..." : "Dersi Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}
