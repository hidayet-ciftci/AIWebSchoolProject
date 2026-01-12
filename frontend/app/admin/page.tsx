"use client";

import { useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
  role: "student" | "teacher" | "admin";
  createdAt?: string;
}

interface Course {
  _id: string;
  name: string;
  status?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Paralel olarak tüm verileri çek
        const [usersRes, coursesRes] = await Promise.all([
          fetch("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/courses", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // İstatistikler
  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalTeachers = users.filter((u) => u.role === "teacher").length;
  const activeCourses = courses.filter(
    (c) => !c.status || c.status === "Aktif"
  ).length;

  // Son kayıtlar (en yeni 5 kullanıcı)
  const recentUsers = [...users]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Rol etiketleri
  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      student: "Öğrenci",
      teacher: "Öğretmen",
      admin: "Yönetici",
    };
    return labels[role] || role;
  };

  // Rol renkleri
  const getRoleColor = (role: string) => {
    if (role === "teacher") {
      return "bg-purple-100 text-purple-700";
    } else if (role === "student") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c] mb-2">
            Yönetim Paneli
          </h1>
          <p className="text-[#718096]">Sistem genel durumu ve istatistikler</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-3xl text-white shadow-md">
            👨‍🎓
          </div>
          <div>
            <p className="text-gray-500 text-sm">Toplam Öğrenci</p>
            <p className="text-2xl font-bold text-[#1a202c]">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-3xl text-white shadow-md">
            👨‍🏫
          </div>
          <div>
            <p className="text-gray-500 text-sm">Toplam Öğretmen</p>
            <p className="text-2xl font-bold text-[#1a202c]">{totalTeachers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-3xl text-white shadow-md">
            📚
          </div>
          <div>
            <p className="text-gray-500 text-sm">Aktif Dersler</p>
            <p className="text-2xl font-bold text-[#1a202c]">{activeCourses}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#1a202c] mb-6">Son Kayıtlar</h2>
        {recentUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz kayıtlı kullanıcı bulunmamaktadır.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f7fafc] text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">Ad Soyad</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">E-posta</th>
                  <th className="p-4">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-[#1a202c]">
                      {user.name} {user.surname}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4 text-green-600 font-medium">Aktif</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
