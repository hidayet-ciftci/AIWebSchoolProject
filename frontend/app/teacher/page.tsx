"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Section = "profile" | "courses" | "exams" | "grades" | "chatbot";

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Merhaba! Ben AI öğretim asistanınızım. Ders içerikleriniz, sınav hazırlığı veya not girişi konularında yardımcı olabilirim.",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleLogout = () => router.push("/");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: inputText }]);
    const tempInput = inputText;
    setInputText("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `"${tempInput}" ile ilgili talebinizi değerlendiriyorum.`,
        },
      ]);
    }, 1000);
  };

  const NavButton = ({
    section,
    icon,
    label,
  }: {
    section: Section;
    icon: string;
    label: string;
  }) => (
    <button
      onClick={() => {
        setActiveSection(section);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
        activeSection === section
          ? "bg-[#667eea]/20 text-white"
          : "text-gray-400 hover:bg-white/10"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f7fafc] overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 w-[280px] h-full bg-gradient-to-b from-[#1a202c] to-[#2d3748] p-6 flex flex-col text-white transition-transform duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg">
            👨‍🏫
          </div>
          <h2 className="font-semibold text-lg">Prof. Dr. Mehmet Demir</h2>
          <p className="text-gray-400 text-sm">Öğretmen</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavButton section="profile" icon="👤" label="Profil" />
          <NavButton section="courses" icon="📚" label="Dersler" />
          <NavButton section="exams" icon="📝" label="Sınavlar" />
          <NavButton section="grades" icon="📊" label="Notlar" />
          <NavButton section="chatbot" icon="🤖" label="ChatBot" />
        </nav>

        <button
          onClick={handleLogout}
          className="w-full p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-semibold mt-4 cursor-pointer"
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
          {/* PROFILE SECTION */}
          {activeSection === "profile" && (
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
                Profil Bilgileri
              </h1>
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { label: "Ad", value: "Mehmet" },
                    { label: "Soyad", value: "Demir" },
                    { label: "Yaş", value: "45" },
                    { label: "Cinsiyet", value: "Erkek" },
                    { label: "Sicil No", value: "AKD-2015-001" },
                    {
                      label: "E-posta",
                      value: "mehmet.demir@universite.edu.tr",
                    },
                    {
                      label: "Bölüm",
                      value: "Bilgisayar Mühendisliği",
                      full: true,
                    },
                  ].map((item, i) => (
                    <div key={i} className={item.full ? "md:col-span-2" : ""}>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        {item.label}
                      </label>
                      <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COURSES SECTION */}
          {activeSection === "courses" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
                Derslerim
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: "💻",
                    name: "Veri Yapıları",
                    detail: "3. Sınıf - Bahar Dönemi",
                    studentCount: "45 Öğrenci",
                  },
                  {
                    icon: "⚙️",
                    name: "Algoritma Analizi",
                    detail: "4. Sınıf - Bahar Dönemi",
                    studentCount: "32 Öğrenci",
                  },
                ].map((course, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform"
                  >
                    <div className="text-3xl mb-4">{course.icon}</div>
                    <h3 className="text-xl font-bold text-[#1a202c] mb-2">
                      {course.name}
                    </h3>
                    <p className="text-gray-500 mb-4">{course.detail}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[#667eea] font-semibold">
                        {course.studentCount}
                      </span>
                      <span className="bg-[#e6fffa] text-[#319795] px-3 py-1 rounded-full text-sm font-bold">
                        Aktif
                      </span>
                    </div>
                    <button className="w-full py-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold">
                      Derse Git
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXAMS SECTION */}
          {activeSection === "exams" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
                Sınav Yönetimi
              </h1>
              <button className="mb-6 px-6 py-3 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold hover:-translate-y-0.5 transition-transform">
                + Yeni Sınav Oluştur
              </button>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="hidden md:grid grid-cols-5 gap-4 pb-4 border-b border-gray-200 mb-4 font-bold text-gray-600">
                  <div className="col-span-2">Ders</div>
                  <div>Tarih</div>
                  <div>Katılım</div>
                  <div>İşlem</div>
                </div>
                {[
                  {
                    name: "Veri Yapıları - Vize",
                    duration: "90 dakika",
                    date: "15 Mayıs 2024",
                    attendance: "42/45",
                    status: "Yaklaşıyor",
                    color: "bg-[#fef5e7] text-[#d97706]",
                    action: "Düzenle",
                  },
                  {
                    name: "Algoritma Analizi - Quiz",
                    duration: "45 dakika",
                    date: "8 Mayıs 2024",
                    attendance: "32/32",
                    status: "Tamamlandı",
                    color: "bg-[#e6fffa] text-[#319795]",
                    action: "Görüntüle",
                  },
                ].map((exam, i) => (
                  <div
                    key={i}
                    className="grid md:grid-cols-5 gap-4 items-center py-4 border-b border-gray-50 last:border-0"
                  >
                    <div className="col-span-2">
                      <p className="font-semibold text-[#1a202c]">
                        {exam.name}
                      </p>
                      <p className="text-sm text-gray-500">{exam.duration}</p>
                    </div>
                    <div className="text-[#1a202c]">{exam.date}</div>
                    <div className="text-[#1a202c]">{exam.attendance}</div>
                    <div>
                      <button
                        className={`px-4 py-1.5 rounded-lg text-white text-sm font-semibold ${
                          i === 0 ? "bg-[#667eea]" : "bg-gray-500"
                        }`}
                      >
                        {exam.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GRADES SECTION */}
          {activeSection === "grades" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
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
                    className="bg-white p-4 rounded-xl shadow-sm text-center border border-gray-100"
                  >
                    <p className="text-gray-500 text-sm mb-1">
                      {stat.split(":")[0]}
                    </p>
                    <p className="text-2xl font-bold text-[#667eea]">
                      {stat.split(":")[1]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#f7fafc] text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4">Öğrenci</th>
                        <th className="p-4">Vize</th>
                        <th className="p-4">Quiz</th>
                        <th className="p-4">Ödev</th>
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
                          avg: 88,
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
                          <td className="p-4">
                            <p className="font-semibold text-[#1a202c]">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.no}
                            </p>
                          </td>
                          <td className="p-4 font-semibold text-[#1a202c]">
                            {student.v}
                          </td>
                          <td className="p-4 font-semibold text-[#1a202c]">
                            {student.q}
                          </td>
                          <td className="p-4 font-semibold text-[#1a202c]">
                            {student.f}
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

          {/* CHATBOT SECTION */}
          {activeSection === "chatbot" && (
            <div className="max-w-4xl mx-auto animate-fadeIn h-full flex flex-col">
              <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
                AI Asistan
              </h1>
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden max-h-[600px]">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-2xl text-white">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1a202c] text-lg">
                      AI Öğretim Asistanı
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ders yönetiminde size yardımcı olacağım!
                    </p>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f7fafc]">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="w-9 h-9 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-lg text-white shrink-0">
                          🤖
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-xl max-w-[75%] shadow-sm ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white"
                            : "bg-white text-[#1a202c]"
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={handleSendMessage}
                  className="p-6 border-t border-gray-100 flex gap-3"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 p-3 border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#667eea]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold hover:-translate-y-0.5 transition-transform cursor-pointer"
                  >
                    Gönder
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
