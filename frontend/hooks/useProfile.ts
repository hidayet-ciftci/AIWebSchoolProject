import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface UserProfile {
  name: string;
  surname: string;
  age: number;
  gender: string;
  email: string;
  role: string;
  studentNo?: number;
  sicilNo?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/users/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

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
  }, []);

  return { profile, loading };
}
