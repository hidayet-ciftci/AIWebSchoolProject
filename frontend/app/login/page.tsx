"use client"; // Bu bir Client Component (etkileşim var)
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); // Sayfa yönlendirmesi için

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    try {
      // Backend'e istek atıyoruz
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Token'ı kaydet (Tarayıcı hafızasına)
        localStorage.setItem("token", data.accessToken);

        // 2. Kullanıcıyı özel sayfaya (Dashboard) gönder
        alert("Giriş Başarılı!");
        router.push("/dashboard");
      } else {
        alert(data.message || "Giriş başarısız");
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Giriş Yap</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-80">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Şifre"
          className="border p-2 rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Giriş Yap
        </button>
      </form>
    </div>
  );
}
