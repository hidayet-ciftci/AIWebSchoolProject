"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    // 1. Token var mı kontrol et
    const token = localStorage.getItem("token");

    if (!token) {
      // Token yoksa login sayfasına geri postala
      router.push("/login");
    } else {
      // Token varsa, verileri çekebilirsin
      fetchUsers(token);
    }
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      // Backend'deki /api/list rotasına istek atıyoruz
      // verifyToken middleware'i "Authorization: Bearer <token>" bekler
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/list/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setUserList(data);
      } else {
        // Token geçersizse çıkış yaptır
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Hoşgeldiniz (Özel Alan)</h1>
      <p>Burayı sadece giriş yapmış kullanıcılar görebilir.</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Kullanıcı Listesi:</h2>
        <ul>
          {userList.map((user: any) => (
            <li key={user._id} className="border-b py-2">
              {user.Fname} {user.Lname} - {user.role}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/login");
        }}
        className="mt-8 bg-red-500 text-white p-2 rounded"
      >
        Çıkış Yap
      </button>
    </div>
  );
}
