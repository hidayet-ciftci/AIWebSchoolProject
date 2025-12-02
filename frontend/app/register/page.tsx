"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  // Form verilerini tutacak state
  const [formData, setFormData] = useState({
    Fname: "",
    Lname: "",
    age: "",
    gender: "male", // Varsayılan değer
    email: "",
    password: "",
    role: "student", // Varsayılan değer
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Yaşın sayı (number) olması gerektiği için dönüşüm yapıyoruz
    const payload = { ...formData, age: Number(formData.age) };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Kayıt Başarılı! Giriş sayfasına yönlendiriliyorsunuz.");
        router.push("/login");
      } else {
        alert(data.message || "Kayıt başarısız");
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 text-black">
      <h1 className="text-2xl font-bold mb-4">Kayıt Ol</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-3 w-80">
        <input
          name="Fname"
          placeholder="Ad"
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="Lname"
          placeholder="Soyad"
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="age"
          type="number"
          placeholder="Yaş"
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <select
          name="gender"
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="male">Erkek</option>
          <option value="female">Kadın</option>
        </select>

        <select
          name="role"
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="student">Öğrenci</option>
          <option value="teacher">Öğretmen</option>
        </select>

        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Şifre (Min 8 karakter)"
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Kayıt Ol
        </button>
      </form>
    </div>
  );
}
