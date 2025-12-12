"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function profilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(
          "http://localhost:5000/api/list/user/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("response not ok");
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.log(error);
        toast.error("hata");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }
  if (!profile) {
    return <div className="p-8 text-center">Profil bulunamadı.</div>;
  }
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
        Profil Bilgileri
      </h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-[#1a202c] mb-6">
          Kişisel Bilgiler
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gelen profile verisini burada ekrana basıyoruz */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Ad
            </label>
            <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
              {profile?.name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Soyad
            </label>
            <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
              {profile.surname}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Yaş
            </label>
            <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
              {profile.age}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Cinsiyet
            </label>
            <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
              {profile.gender}
            </p>
          </div>
          {/* Öğrenciyse numarasını, öğretmense sicilini göster (Backend Modelinize göre) */}
          {profile.role === "student" && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Öğrenci No
              </label>
              <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
                {profile.studentNo}
              </p>
            </div>
          )}
          {profile.role === "teacher" && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Sicil No
              </label>
              <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
                {profile.sicilNo}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              E-posta
            </label>
            <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
              {profile.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
