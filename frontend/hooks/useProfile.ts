import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UserProfile } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Profil alınamadı");

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error(error);
        toast.error("Profil bilgileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [API_URL]);

  return { profile, loading };
}
