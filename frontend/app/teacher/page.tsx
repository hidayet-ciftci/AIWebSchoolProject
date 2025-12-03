"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Section = "profile" | "grades" | "chatbot";

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("grades");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => router.push("/");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 w-[280px] h-full bg-gradient-to-b from-gray-900 to-gray-800 p-6 flex flex-col text-white transition-transform duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg">
            👨‍🏫
          </div>
          <h2 className="font-semibold text-lg">Prof. Dr. Demir</h2>
          <p className="text-gray-400 text-sm">Akademisyen</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveSection("profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeSection === "profile"
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <span>👤</span> Profil
          </button>
          <button
            onClick={() => setActiveSection("grades")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeSection === "grades"
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <span>📊</span> Not Girişi
          </button>
          <button
            onClick={() => setActiveSection("chatbot")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeSection === "chatbot"
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <span>🤖</span> Asistan
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="w-full p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-semibold mt-4"
        >
          🚪 Çıkış Yap
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white shadow-sm flex items-center justify-between">
          <h1 className="font-bold text-gray-800">Öğretmen Paneli</h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-2xl"
          >
            ☰
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* GRADES SECTION */}
          {activeSection === "grades" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Not Yönetimi
              </h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  "Vize Ort: 78.5",
                  "Quiz Ort: 82.3",
                  "Ödev Ort: 85.7",
                  "Genel: 81.2",
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-xl shadow-sm text-center"
                  >
                    <p className="text-gray-500 text-sm mb-1">
                      {stat.split(":")[0]}
                    </p>
                    <p className="text-xl font-bold text-[#667eea]">
                      {stat.split(":")[1]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4">Öğrenci No</th>
                        <th className="p-4">Ad Soyad</th>
                        <th className="p-4">Vize</th>
                        <th className="p-4">Quiz</th>
                        <th className="p-4">Final</th>
                        <th className="p-4">Ortalama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        {
                          no: "2023001",
                          name: "Ahmet Yılmaz",
                          v: 80,
                          q: 90,
                          f: 85,
                          avg: 85,
                        },
                        {
                          no: "2023002",
                          name: "Ayşe Kaya",
                          v: 85,
                          q: 88,
                          f: 92,
                          avg: 88.3,
                        },
                        {
                          no: "2023003",
                          name: "Mehmet Özkan",
                          v: 72,
                          q: 75,
                          f: 78,
                          avg: 75,
                        },
                      ].map((student, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4 text-gray-500">{student.no}</td>
                          <td className="p-4 font-medium text-gray-800">
                            {student.name}
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              defaultValue={student.v}
                              className="w-16 p-1 border rounded text-center"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              defaultValue={student.q}
                              className="w-16 p-1 border rounded text-center"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              defaultValue={student.f}
                              className="w-16 p-1 border rounded text-center"
                            />
                          </td>
                          <td className="p-4 font-bold text-[#667eea]">
                            {student.avg}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other sections */}
          {(activeSection === "profile" || activeSection === "chatbot") && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Bu modül yapım aşamasındadır.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
