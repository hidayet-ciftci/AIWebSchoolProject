"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// Tipler
interface UserProfile {
  _id: string;
  name: string;
  surname: string;
  studentNo?: number;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams(); // URL'den ID'yi alır (örn: /admin/courses/c1 -> c1)

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    lessonNumber: "",
    teacherId: "",
    studentIds: [] as string[],
    status: "Aktif",
  });

  useEffect(() => {
    // 1. Öğretmen ve Öğrenci Listelerini Çek
    setTeachers([
      { _id: "t1", name: "Mehmet", surname: "Demir" },
      { _id: "t2", name: "Ayşe", surname: "Kara" },
    ]);
    setStudents([
      { _id: "s1", name: "Ali", surname: "Yılmaz", studentNo: 101 },
      { _id: "s2", name: "Veli", surname: "Can", studentNo: 102 },
      { _id: "s3", name: "Zeynep", surname: "Su", studentNo: 103 },
    ]);

    // 2. Mevcut Dersi ID'ye Göre Çek (Simülasyon)
    // Gerçekte: fetch(`/api/courses/${params.id}`)
    if (params.id === "c1") {
      setFormData({
        name: "Veri Yapıları",
        lessonNumber: "101",
        teacherId: "t1",
        studentIds: ["s1", "s2"], // Önceden seçilmiş öğrenciler
        status: "Aktif",
      });
    }
  }, [params.id]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleStudent = (studentId: string) => {
    const currentList = formData.studentIds;
    if (currentList.includes(studentId)) {
      setFormData({
        ...formData,
        studentIds: currentList.filter((id) => id !== studentId),
      });
    } else {
      setFormData({ ...formData, studentIds: [...currentList, studentId] });
    }
  };

  const handleSave = () => {
    console.log("GÜNCELLENECEK VERİ:", params.id, formData);
    // TODO: fetch(`/api/courses/${params.id}`, { method: 'PUT', body: ... })
    router.push("/admin/courses");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex justify-center py-10 px-4 animate-fadeIn">
      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-fit border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Dersi Düzenle</h2>
          <p className="text-sm text-gray-500 mt-1">
            Mevcut ders bilgilerini güncelleyin.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Ad ve Kod */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders Adı
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ders Kodu
              </label>
              <input
                type="number"
                name="lessonNumber"
                value={formData.lessonNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>
          </div>

          {/* Öğretmen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Öğretmen
            </label>
            <div className="relative">
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-purple-500 outline-hidden bg-white"
              >
                <option value="">Öğretmen Seçiniz...</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} {t.surname}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Öğrenci Listesi */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Öğrencileri Seç
              </label>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                {formData.studentIds.length} Seçili
              </span>
            </div>
            <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 divide-y divide-gray-100">
              {students.map((student) => {
                const isSelected = formData.studentIds.includes(student._id);
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#667eea] text-white font-medium rounded-lg hover:bg-[#5a6fd6] shadow-md hover:shadow-lg transform active:scale-95 transition-all"
          >
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
