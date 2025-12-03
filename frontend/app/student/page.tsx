"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Section = "profile" | "courses" | "chatbot";

export default function StudentDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Merhaba! Ben öğrenci asistanınım. Sana nasıl yardımcı olabilirim?",
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

    // Yapay zeka simülasyonu
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `"${tempInput}" konulu sorunu anladım. Şu an demo modundayım.`,
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
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
        activeSection === section
          ? "bg-white/20 text-white"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

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
            👨‍🎓
          </div>
          <h2 className="font-semibold text-lg">Ahmet Yılmaz</h2>
          <p className="text-gray-400 text-sm">Bilgisayar Müh.</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavButton section="profile" icon="👤" label="Profil" />
          <NavButton section="courses" icon="📚" label="Dersler" />
          <NavButton section="chatbot" icon="🤖" label="AI Asistan" />
        </nav>

        <button
          onClick={handleLogout}
          className="w-full p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-semibold mt-4 flex items-center justify-center gap-2"
        >
          🚪 Çıkış Yap
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white shadow-sm flex items-center justify-between">
          <h1 className="font-bold text-gray-800">Öğrenci Paneli</h1>
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
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Profil Bilgileri
              </h1>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    "Ad: Ahmet",
                    "Soyad: Yılmaz",
                    "No: 2023001",
                    "Bölüm: Bilgisayar Müh.",
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-800 font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COURSES SECTION */}
          {activeSection === "courses" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Derslerim
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Veri Yapıları", code: "CENG301", status: "Aktif" },
                  { name: "Yapay Zeka", code: "AI401", status: "Aktif" },
                  {
                    name: "Web Programlama",
                    code: "WEB202",
                    status: "Tamamlandı",
                  },
                ].map((course, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="text-3xl mb-4">💻</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {course.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">{course.code}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        course.status === "Aktif"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHATBOT SECTION */}
          {activeSection === "chatbot" && (
            <div className="max-w-4xl mx-auto animate-fadeIn h-full flex flex-col">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                AI Asistan
              </h1>
              <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden max-h-[600px]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-xl text-white">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      Öğrenci Asistanı
                    </h3>
                    <p className="text-xs text-green-600 font-medium">
                      ● Çevrimiçi
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="w-8 h-8 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-sm text-white shrink-0">
                          🤖
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl max-w-[80%] ${
                          msg.role === "user"
                            ? "bg-[#667eea] text-white rounded-tr-none"
                            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none"
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-100 flex gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Bir şeyler yazın..."
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#667eea] focus:ring-1 focus:ring-[#667eea]"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-[#667eea] text-white rounded-xl hover:bg-[#5a6fd6] transition-colors"
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
