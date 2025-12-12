"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function WelcomePage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<"student" | "teacher">("student");

  // 1. ADIM: User state'ini tüm alanları içerecek şekilde bir obje olarak başlatıyoruz
  const [user, setUser] = useState({
    name: "",
    surname: "",
    age: "",
    gender: "",
    email: "",
    password: "",
  });

  // 2. ADIM: Herhangi bir input değiştiğinde çalışacak genel fonksiyon
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...user, role: userType };
    const endpoint = isLogin ? "login" : "register";
    console.log(endpoint);
    if (endpoint === "register") {
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          body: JSON.stringify(finalData),
          headers: {
            "Content-Type": "application/json",
          },
        });
        // 2. İçerik Tipini Kontrol Et (HTML mi JSON mı?)
        const contentType = response.headers.get("content-type");

        // Eğer yanıt JSON değilse (örn: HTML sayfası dönüyorsa), API adresi yanlıştır veya sunucu çökmüştür.
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Sunucuya bağlanılamadı veya geçersiz bir yanıt alındı."
          );
        }
        const data = await response.json();
        console.log("data:", data);
        if (!response.ok) {
          throw new Error(data.message || "an error occured");
        }
        console.log("Başarılı:", data.message);
        if (!isLogin) {
          setIsLogin(true);
          toast.success("Succesfully Registered", { id: "succesID" });
        }
      } catch (error: any) {
        let errorMessage = error.message;
        // Eğer sunucu tamamen kapalıysa fetch "Failed to fetch" hatası verir.
        if (errorMessage === "Failed to fetch") {
          errorMessage =
            "Sunucuya bağlanılamadı. Lütfen internetinizi veya sunucuyu kontrol edin.";
        }
        toast.error(errorMessage, { id: "toastId" });
      }
    } else {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          body: JSON.stringify(finalData),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Sunucuya bağlanılamadı veya geçersiz bir yanıt alındı."
          );
        }
        if (!response.ok) throw new Error(data.message);
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.role === "student") {
          router.push("/student");
        } else if (data.user.role === "teacher") {
          router.push("/teacher");
        }
        toast.success(data.message, { id: "SuccessLoginID" });
      } catch (error: any) {
        toast.error(error.message, { id: "loginErrorID" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full shadow-2xl transition-all duration-300 fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-br from-[#667eea] to-[#764ba2] rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            AI Destekli OBS
          </h1>
          <p className="text-gray-500">Öğrenci Bilgi Sistemi</p>
        </div>

        {/* Form Container */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Register Fields (Conditional) */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Ad
                    </label>
                    <input
                      required
                      type="text"
                      name="name" // State'deki isimle aynı olmalı
                      value={user.name} // State'e bağlandı
                      onChange={handleChange} // Fonksiyona bağlandı
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea] outline-none transition-colors"
                      placeholder="Ad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Soyad
                    </label>
                    <input
                      required
                      type="text"
                      name="surname"
                      value={user.surname}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea] outline-none transition-colors"
                      placeholder="Soyad"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Yaş
                    </label>
                    <input
                      required
                      type="number"
                      name="age"
                      value={user.age}
                      onChange={handleChange}
                      min="15"
                      max="100"
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea] outline-none transition-colors"
                      placeholder="Yaş"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Cinsiyet
                    </label>
                    <select
                      required
                      name="gender"
                      value={user.gender}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea] outline-none transition-colors bg-white"
                    >
                      <option value="">Seçiniz</option>
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                E-posta
              </label>
              <input
                required
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea] outline-none transition-colors"
                placeholder="ornek@email.com"
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
                value={user.password}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea] outline-none transition-colors"
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            {/* User Type Selection */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Kullanıcı Tipi
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("student")}
                    className={`flex-1 p-3 rounded-lg font-semibold border-2 transition-all ${
                      userType === "student"
                        ? "bg-[#667eea] text-white border-[#667eea]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    👨‍🎓 Öğrenci
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("teacher")}
                    className={`flex-1 p-3 rounded-lg font-semibold border-2 transition-all ${
                      userType === "teacher"
                        ? "bg-[#667eea] text-white border-[#667eea]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    👨‍🏫 Öğretmen
                  </button>
                </div>
              </div>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              className="w-full p-3.5 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              {isLogin ? "Giriş Yap" : "Kayıt Ol"}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center mt-6">
            <span className="text-gray-500 text-sm">
              {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[#667eea] font-semibold text-sm hover:underline cursor-pointer"
            >
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
