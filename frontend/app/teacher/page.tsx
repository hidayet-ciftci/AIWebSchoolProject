"use client";

import Link from "next/link";

export default function TeacherDashboardHome() {
  return (
    <div className="animate-fadeIn space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c] mb-2">
            Hoş Geldiniz, Prof. Dr. Mehmet Demir! 👋
          </h1>
          <p className="text-[#718096]">
            Bugün 2 dersiniz ve 1 yaklaşan sınav var
          </p>
        </div>
        <div className="bg-white p-4 px-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-[#718096] mb-1">Toplam Öğrenci</p>
          <p className="text-3xl font-bold text-[#667eea]">77</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          {
            icon: "📚",
            label: "Aktif Dersler",
            value: "2",
            bg: "from-[#667eea] to-[#764ba2]",
          },
          {
            icon: "📝",
            label: "Bekleyen Sınavlar",
            value: "3",
            bg: "from-[#f6ad55] to-[#ed8936]",
          },
          {
            icon: "✅",
            label: "Girilecek Not",
            value: "42",
            bg: "from-[#48bb78] to-[#38a169]",
          },
          {
            icon: "📊",
            label: "Sınıf Ortalaması",
            value: "81.2",
            bg: "from-[#9f7aea] to-[#805ad5]",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-300"
          >
            <div
              className={`w-12 h-12 bg-linear-to-br ${stat.bg} rounded-xl flex items-center justify-center text-2xl text-white mb-3`}
            >
              {stat.icon}
            </div>
            <p className="text-sm text-[#718096] mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-[#1a202c]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Split Section: Exams & Tasks */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Exams (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a202c]">
              Yaklaşan Sınavlar
            </h2>
            <Link
              href="/teacher/exams"
              className="text-[#667eea] font-semibold text-sm hover:underline"
            >
              Tümünü Gör →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-[#fef5e7] border-l-4 border-[#f59e0b] rounded-r-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-[#1a202c]">
                    Veri Yapıları - Vize
                  </p>
                  <p className="text-sm text-[#718096]">45 Öğrenci Katılacak</p>
                </div>
                <span className="bg-[#fef5e7] text-[#d97706] px-3 py-1 rounded-full text-xs font-bold border border-[#f59e0b]">
                  3 Gün Kaldı
                </span>
              </div>
              <div className="flex gap-4 text-sm text-[#718096] mb-3">
                <span>📅 15 Mayıs 2024</span>
                <span>⏱️ 90 dakika</span>
                <span>📍 A-201 Amfi</span>
              </div>
              <button className="w-full py-2 bg-[#667eea] text-white rounded-lg text-sm font-semibold hover:bg-[#5a6fd6] transition-colors cursor-pointer">
                Sınav Detayları
              </button>
            </div>
            <div className="p-4 bg-[#e0e7ff] border-l-4 border-[#667eea] rounded-r-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-[#1a202c]">
                    Algoritma Analizi - Quiz
                  </p>
                  <p className="text-sm text-[#718096]">32 Öğrenci Katılacak</p>
                </div>
                <span className="bg-[#e0e7ff] text-[#667eea] px-3 py-1 rounded-full text-xs font-bold border border-[#667eea]">
                  8 Gün Kaldı
                </span>
              </div>
              <div className="flex gap-4 text-sm text-[#718096] mb-3">
                <span>📅 20 Mayıs 2024</span>
                <span>⏱️ 45 dakika</span>
                <span>📍 B-102 Sınıf</span>
              </div>
              <button className="w-full py-2 bg-[#667eea] text-white rounded-lg text-sm font-semibold hover:bg-[#5a6fd6] transition-colors cursor-pointer">
                Sınav Detayları
              </button>
            </div>
          </div>
        </div>

        {/* Pending Tasks (1 Column) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a202c]">Bekleyen İşler</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                title: "Not Girişi",
                badge: "42",
                desc: "Algoritma Quiz notları",
                bg: "bg-[#fef5e7]",
                border: "border-[#f59e0b]",
                badgeBg: "bg-[#f59e0b]",
              },
              {
                title: "Ödev Kontrolü",
                badge: "18",
                desc: "Veri Yapıları Ödev 3",
                bg: "bg-[#e0e7ff]",
                border: "border-[#667eea]",
                badgeBg: "bg-[#667eea]",
              },
              {
                title: "Yoklama",
                badge: "2",
                desc: "Bugünkü dersler",
                bg: "bg-[#f0fff4]",
                border: "border-[#38a169]",
                badgeBg: "bg-[#38a169]",
              },
              {
                title: "Toplantı",
                badge: "1",
                desc: "Bölüm toplantısı - Yarın",
                bg: "bg-[#fed7e2]",
                border: "border-[#f56565]",
                badgeBg: "bg-[#f56565]",
              },
            ].map((task, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-lg border-l-[3px] ${task.bg} ${task.border}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-[#1a202c] text-sm">
                    {task.title}
                  </p>
                  <span
                    className={`${task.badgeBg} text-white px-2 py-0.5 rounded-full text-[11px] font-bold`}
                  >
                    {task.badge}
                  </span>
                </div>
                <p className="text-xs text-[#718096]">{task.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#1a202c] mb-6">
          Bugünkü Dersler
        </h2>
        <div className="space-y-4">
          {[
            {
              time: "09:00",
              end: "10:30",
              name: "Veri Yapıları",
              detail: "3. Sınıf - 45 Öğrenci",
              loc: "A-201 Amfi",
              status: "Devam Ediyor",
              statusColor: "bg-[#e6fffa] text-[#319795]",
              borderColor: "border-[#667eea]",
              btn: "Yoklama Al",
              btnColor: "bg-[#667eea] text-white",
            },
            {
              time: "14:00",
              end: "15:30",
              name: "Algoritma Analizi",
              detail: "4. Sınıf - 32 Öğrenci",
              loc: "B-102 Sınıf",
              status: "Planlı",
              statusColor: "bg-[#f7fafc] text-[#718096]",
              borderColor: "border-[#a0aec0]",
              btn: "Ders Planı",
              btnColor: "bg-[#a0aec0] text-white",
            },
          ].map((cls, i) => (
            <div
              key={i}
              className={`grid grid-cols-[80px_1fr_auto] gap-4 items-center p-4 bg-[#f7fafc] rounded-lg border-l-4 ${cls.borderColor}`}
            >
              <div className="text-center">
                <p
                  className={`text-2xl font-bold ${
                    i === 0 ? "text-[#667eea]" : "text-[#718096]"
                  }`}
                >
                  {cls.time}
                </p>
                <p className="text-xs text-[#718096]">{cls.end}</p>
              </div>
              <div>
                <p className="font-bold text-[#1a202c] mb-1">{cls.name}</p>
                <p className="text-sm text-[#718096] mb-1">{cls.detail}</p>
                <p className="text-xs text-[#667eea]">📍 {cls.loc}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold text-center ${cls.statusColor}`}
                >
                  {cls.status}
                </span>
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${cls.btnColor}`}
                >
                  {cls.btn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
