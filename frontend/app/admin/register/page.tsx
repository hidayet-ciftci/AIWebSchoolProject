"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function CreateUserPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Form verileri - Login sayfasından alınan tüm alanlar burada
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    age: "",
    gender: "",
    email: "",
    password: "",
    role: "student", // Varsayılan olarak öğrenci seçili gelir
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basit validasyon
    if (!formData.role) {
      toast.error("Lütfen bir rol seçin");
      return;
    }

    try {
      // Backend'deki register endpoint'i kullanılır
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Admin token'ı gerekebilir, backend'e göre değişir ama genelde eklenir:
          // "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(
        `Yeni ${
          formData.role === "teacher"
            ? "Öğretmen"
            : formData.role === "admin"
            ? "Admin"
            : "Öğrenci"
        } başarıyla oluşturuldu!`
      );

      // Formu temizle
      setFormData({
        name: "",
        surname: "",
        age: "",
        gender: "",
        email: "",
        password: "",
        role: "student",
      });
    } catch (error: any) {
      toast.error(error.message || "Kayıt işlemi başarısız");
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c]">
            Yeni Kullanıcı Ekle
          </h1>
          <p className="text-gray-500">
            Sisteme yeni Öğrenci, Öğretmen veya Admin kaydedin.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ad Soyad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Ad
              </label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Örn: Ahmet"
                className="w-full p-3 border rounded-lg outline-none focus:border-[#667eea] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Soyad
              </label>
              <input
                required
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                placeholder="Örn: Yılmaz"
                className="w-full p-3 border rounded-lg outline-none focus:border-[#667eea] transition-colors"
              />
            </div>
          </div>

          {/* Yaş Cinsiyet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Yaş
              </label>
              <input
                required
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg outline-none focus:border-[#667eea] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Cinsiyet
              </label>
              <select
                required
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg outline-none focus:border-[#667eea] bg-white transition-colors"
              >
                <option value="">Seçiniz</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
              </select>
            </div>
          </div>

          {/* ROL SEÇİMİ - En Kritik Kısım */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="block text-sm font-bold text-blue-800 mb-2">
              Kullanıcı Rolü
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === "student"}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#667eea]"
                />
                <span className="text-gray-700">Öğrenci</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={formData.role === "teacher"}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#667eea]"
                />
                <span className="text-gray-700">Öğretmen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === "admin"}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#667eea]"
                />
                <span className="text-red-600 font-semibold">Admin</span>
              </label>
            </div>
          </div>

          {/* Giriş Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                E-posta
              </label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg outline-none focus:border-[#667eea] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Şifre
              </label>
              <input
                required
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg outline-none focus:border-[#667eea] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold hover:shadow-lg hover:-translate-y-1 transition-all mt-4 cursor-pointer"
          >
            Kullanıcıyı Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}
