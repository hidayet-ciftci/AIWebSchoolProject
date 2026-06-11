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
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

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

  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalTeachers = users.filter((u) => u.role === "teacher").length;
  const activeCourses = courses.filter(
    (c) => !c.status || c.status === "Aktif",
  ).length;

  // ensure users are always sorted by createdAt desc (most recent first)
  const sortedUsers = [...users].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const recentUsers = sortedUsers.slice(0, 5);

  const usersToShow = showAll ? sortedUsers : recentUsers;

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    surname: string;
    email: string;
    role: User["role"];
  }>({ name: "", surname: "", email: "", role: "student" });

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Kullanıcı silinirken hata oluştu");
      }
    } catch (err) {
      console.error(err);
      alert("Kullanıcı silinirken hata oluştu");
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user._id);
    setEditForm({
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => prev.map((u) => (u._id === id ? data.user : u)));
        setEditingUserId(null);
      } else {
        const data = await res.json();
        alert(data.message || "Güncelleme hatası");
      }
    } catch (err) {
      console.error(err);
      alert("Güncelleme hatası");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      student: "Öğrenci",
      teacher: "Öğretmen",
      admin: "Yönetici",
    };
    return labels[role] || role;
  };

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
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-3xl text-white shadow-md">
            👨‍🎓
          </div>
          <div>
            <p className="text-gray-500 text-sm">Toplam Öğrenci</p>
            <p className="text-2xl font-bold text-[#1a202c]">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-3xl text-white shadow-md">
            👨‍🏫
          </div>
          <div>
            <p className="text-gray-500 text-sm">Toplam Öğretmen</p>
            <p className="text-2xl font-bold text-[#1a202c]">{totalTeachers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center text-3xl text-white shadow-md">
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Kullanıcılar</h3>
          <button
            onClick={() => setShowAll((s) => !s)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showAll ? "Sadece Son 5" : "Tümünü Görüntüle"}
          </button>
        </div>

        {usersToShow.length === 0 ? (
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
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersToShow.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-[#1a202c]">
                      {editingUserId === user._id ? (
                        <div className="flex gap-2">
                          <input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((s) => ({
                                ...s,
                                name: e.target.value,
                              }))
                            }
                            className="border rounded p-1 text-sm"
                          />
                          <input
                            value={editForm.surname}
                            onChange={(e) =>
                              setEditForm((s) => ({
                                ...s,
                                surname: e.target.value,
                              }))
                            }
                            className="border rounded p-1 text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          {user.name} {user.surname}
                        </>
                      )}
                    </td>
                    <td className="p-4">
                      {editingUserId === user._id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm((s) => ({
                              ...s,
                              role: e.target.value as User["role"],
                            }))
                          }
                          className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(editForm.role)}`}
                        >
                          <option value="student">Öğrenci</option>
                          <option value="teacher">Öğretmen</option>
                          <option value="admin">Yönetici</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {editingUserId === user._id ? (
                        <input
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm((s) => ({
                              ...s,
                              email: e.target.value,
                            }))
                          }
                          className="border rounded p-1 text-sm w-full"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="p-4 text-green-600 font-medium">Aktif</td>
                    <td className="p-4 text-right">
                      {editingUserId === user._id ? (
                        <>
                          <button
                            onClick={() => saveEdit(user._id)}
                            className="text-sm text-green-600 mr-4"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-sm text-gray-600"
                          >
                            İptal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(user)}
                            className="text-sm text-yellow-600 mr-4"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-sm text-red-600"
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </td>
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
