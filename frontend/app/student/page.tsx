"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Bölümleri tanımlıyoruz
type Section = "profile" | "courses" | "exams" | "grades" | "chatbot";

export default function StudentDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Merhaba! Ben AI öğrenme asistanınızım. Size dersleriniz, ödevleriniz veya sınavlarınız hakkında yardımcı olabilirim. Nasıl yardımcı olabilirim?",
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
          text: `"${tempInput}" konulu sorunu anladım. Size yardımcı olmak için elimden geleni yapacağım.`,
        },
      ]);
    }, 1000);
  };

  // Navigasyon butonu bileşeni
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
          : "text-gray-400 hover:bg-white/10 hover:text-white"
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
            👨‍🎓
          </div>
          <h2 className="font-semibold text-lg">Ahmet Yılmaz</h2>
          <p className="text-gray-400 text-sm">Öğrenci</p>
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
          className="w-full p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-semibold mt-4 flex items-center justify-center gap-2 cursor-pointer"
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
              <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
                Profil Bilgileri
              </h1>
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-[#1a202c] mb-6">
                  Kişisel Bilgiler
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { label: "Ad", value: "Ahmet" },
                    { label: "Soyad", value: "Yılmaz" },
                    { label: "Yaş", value: "21" },
                    { label: "Cinsiyet", value: "Erkek" },
                    { label: "Öğrenci No", value: "2023001" },
                    { label: "E-posta", value: "ahmet@email.com" },
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

              {/* Şifre Değiştirme (Basitleştirilmiş) */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#1a202c] mb-6">
                  Şifre Değiştir
                </h2>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Mevcut Şifre"
                    className="w-full p-3 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="password"
                    placeholder="Yeni Şifre"
                    className="w-full p-3 border border-gray-200 rounded-lg"
                  />
                  <button className="px-8 py-3 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold">
                    Güncelle
                  </button>
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
                    teacher: "Prof. Dr. Mehmet Demir",
                    total: "24 Ders",
                    status: "Devam Ediyor",
                  },
                  {
                    icon: "🤖",
                    name: "Yapay Zeka",
                    teacher: "Doç. Dr. Ayşe Kara",
                    total: "18 Ders",
                    status: "Devam Ediyor",
                  },
                  {
                    icon: "🌐",
                    name: "Web Programlama",
                    teacher: "Dr. Öğr. Üyesi Can Yıldız",
                    total: "20 Ders",
                    status: "Devam Ediyor",
                  },
                ].map((course, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="text-3xl mb-4">{course.icon}</div>
                    <h3 className="text-xl font-bold text-[#1a202c] mb-2">
                      {course.name}
                    </h3>
                    <p className="text-gray-500 mb-4">{course.teacher}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[#667eea] font-semibold">
                        {course.total}
                      </span>
                      <span className="bg-[#e6fffa] text-[#319795] px-3 py-1 rounded-full text-sm font-bold">
                        {course.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXAMS SECTION */}
          {activeSection === "exams" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold text-[#1a202c] mb-6">
                Sınavlar
              </h1>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="hidden md:grid grid-cols-4 gap-4 pb-4 border-b border-gray-200 mb-4 font-bold text-gray-600">
                  <div className="col-span-2">Ders</div>
                  <div>Tarih</div>
                  <div>Süre</div>
                  <div>Durum</div>
                </div>
                {[
                  {
                    name: "Veri Yapıları - Vize",
                    prof: "Prof. Dr. Mehmet Demir",
                    date: "15 Mayıs 2024",
                    time: "90 dk",
                    status: "Yaklaşıyor",
                    color: "bg-[#fef5e7] text-[#d97706]",
                  },
                  {
                    name: "Yapay Zeka - Quiz 2",
                    prof: "Doç. Dr. Ayşe Kara",
                    date: "10 Mayıs 2024",
                    time: "45 dk",
                    status: "Tamamlandı",
                    color: "bg-[#e6fffa] text-[#319795]",
                  },
                  {
                    name: "Web Programlama - Proje",
                    prof: "Dr. Öğr. Üyesi Can Yıldız",
                    date: "25 Mayıs 2024",
                    time: "-",
                    status: "Planlı",
                    color: "bg-[#e0e7ff] text-[#667eea]",
                  },
                ].map((exam, i) => (
                  <div
                    key={i}
                    className="grid md:grid-cols-4 gap-4 items-center py-4 border-b border-gray-50 last:border-0"
                  >
                    <div className="col-span-2">
                      <p className="font-semibold text-[#1a202c]">
                        {exam.name}
                      </p>
                      <p className="text-sm text-gray-500">{exam.prof}</p>
                    </div>
                    <div className="text-[#1a202c]">
                      <span className="md:hidden font-bold">Tarih: </span>
                      {exam.date}
                    </div>
                    <div className="text-[#1a202c]">
                      <span className="md:hidden font-bold">Süre: </span>
                      {exam.time}
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${exam.color}`}
                      >
                        {exam.status}
                      </span>
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
                Notlarım
              </h1>
              <div className="space-y-6">
                {[
                  {
                    name: "Veri Yapıları",
                    score: 85,
                    detail: "Vize: 80 | Quiz: 90 | Ödev: 85",
                  },
                  {
                    name: "Yapay Zeka",
                    score: 92,
                    detail: "Vize: 88 | Quiz: 95 | Ödev: 93",
                  },
                  {
                    name: "Web Programlama",
                    score: 88,
                    detail: "Vize: 85 | Quiz: 90 | Proje: 90",
                  },
                ].map((grade, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-[#1a202c]">
                        {grade.name}
                      </h3>
                      <span className="text-2xl font-bold text-[#667eea]">
                        {grade.score}
                      </span>
                    </div>
                    <div className="w-full bg-[#f7fafc] rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#667eea] to-[#764ba2] h-full rounded-full"
                        style={{ width: `${grade.score}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500">{grade.detail}</div>
                  </div>
                ))}
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
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-2xl text-white">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1a202c] text-lg">
                      AI Öğrenme Asistanı
                    </h3>
                    <p className="text-sm text-gray-500">
                      Size yardımcı olmak için buradayım!
                    </p>
                  </div>
                </div>

                {/* Messages */}
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
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-6 border-t border-gray-100 flex gap-3"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 p-3 border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#667eea] transition-colors"
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
