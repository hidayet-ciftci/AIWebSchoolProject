"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Giriş başarısız");
      }

      // Token ve User bilgisini kaydet
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success(`Hoşgeldiniz, ${data.user.name}`);

      // ROL'E GÖRE OTOMATİK YÖNLENDİRME
      switch (data.user.role) {
        case "admin":
          router.push("/admin");
          break;
        case "teacher":
          router.push("/teacher");
          break;
        case "student":
          router.push("/student");
          break;
        default:
          toast.error("Rol tanımlanamadı!");
          break;
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#667eea] to-[#764ba2] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Başlık Alanı */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">
            🎓
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Giriş Yap</h1>
          <p className="text-gray-500 mt-2">AI Web School Platformu</p>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-[#667eea] transition-all bg-gray-50 focus:bg-white"
              placeholder="ornek@okul.com"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Şifre
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-[#667eea] transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            Giriş Yap
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Hesabınız yok mu? Lütfen okul yönetimi ile iletişime geçin.</p>
        </div>
      </div>
    </div>
  );
}
