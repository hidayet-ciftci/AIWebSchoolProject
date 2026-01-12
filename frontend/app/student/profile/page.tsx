"use client";

import { useProfile } from "@/hooks/useProfile";
import ProfileCard from "@/components/ProfileCard";

export default function ProfilePage() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-[#667eea] animate-pulse">Profil Yükleniyor...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-red-500">Profil bulunamadı.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
        Profil Bilgileri
      </h1>

      <ProfileCard data={profile} />
    </div>
  );
}
