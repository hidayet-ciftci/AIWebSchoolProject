"use client";

import Link from "next/link";

export default function StudentDashboardHome() {
  return (
    <div className="animate-fadeIn space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c] mb-2">
            Hoş Geldiniz, Ahmet! 👋
          </h1>
          <p className="text-[#718096]">
            Bugün 3 dersiniz ve 2 yaklaşan sınavınız var
          </p>
        </div>
        <div className="bg-white p-4 px-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-[#718096] mb-1">Genel Ortalama</p>
          <p className="text-3xl font-bold text-[#667eea]">88.3</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          {
            icon: "📚",
            label: "Aktif Dersler",
            value: "3",
            bg: "from-[#667eea] to-[#764ba2]",
          },
          {
            icon: "✅",
            label: "Tamamlanan Ödevler",
            value: "12",
            bg: "from-[#48bb78] to-[#38a169]",
          },
          {
            icon: "⏰",
            label: "Yaklaşan Sınavlar",
            value: "2",
            bg: "from-[#f6ad55] to-[#ed8936]",
          },
          {
            icon: "📊",
            label: "Devamsızlık",
            value: "2%",
            bg: "from-[#fc8181] to-[#f56565]",
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

      {/* Split Section: Exams & Grades */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Exams (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a202c]">
              Yaklaşan Sınavlar
            </h2>
            <Link
              href="/student/exam"
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
                  <p className="text-sm text-[#718096]">
                    Prof. Dr. Mehmet Demir
                  </p>
                </div>
                <span className="bg-[#fef5e7] text-[#d97706] px-3 py-1 rounded-full text-xs font-bold border border-[#f59e0b]">
                  3 Gün Kaldı
                </span>
              </div>
              <div className="flex gap-4 text-sm text-[#718096]">
                <span>📅 15 Mayıs 2024</span>
                <span>⏱️ 90 dakika</span>
              </div>
            </div>
            <div className="p-4 bg-[#e0e7ff] border-l-4 border-[#667eea] rounded-r-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-[#1a202c]">
                    Web Programlama - Proje
                  </p>
                  <p className="text-sm text-[#718096]">
                    Dr. Öğr. Üyesi Can Yıldız
                  </p>
                </div>
                <span className="bg-[#e0e7ff] text-[#667eea] px-3 py-1 rounded-full text-xs font-bold border border-[#667eea]">
                  13 Gün Kaldı
                </span>
              </div>
              <div className="flex gap-4 text-sm text-[#718096]">
                <span>📅 25 Mayıs 2024</span>
                <span>⏱️ Teslim Tarihi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Grades (1 Column) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1a202c]">Son Notlar</h2>
            <Link
              href="/student/grades"
              className="text-[#667eea] font-semibold text-sm hover:underline"
            >
              Detay →
            </Link>
          </div>
          <div className="space-y-4">
            {[
              {
                lesson: "Yapay Zeka",
                type: "Quiz 2",
                score: 92,
                bg: "bg-[#f0fff4]",
                text: "text-[#38a169]",
              },
              {
                lesson: "Web Programlama",
                type: "Vize",
                score: 88,
                bg: "bg-[#fef5e7]",
                text: "text-[#d97706]",
              },
              {
                lesson: "Veri Yapıları",
                type: "Ödev 3",
                score: 85,
                bg: "bg-[#e6fffa]",
                text: "text-[#319795]",
              },
            ].map((grade, i) => (
              <div
                key={i}
                className={`p-4 ${grade.bg} rounded-lg flex justify-between items-center`}
              >
                <div>
                  <p className="font-bold text-[#1a202c]">{grade.lesson}</p>
                  <p className="text-xs text-[#718096]">{grade.type}</p>
                </div>
                <span className={`text-2xl font-bold ${grade.text}`}>
                  {grade.score}
                </span>
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
              teacher: "Prof. Dr. Mehmet Demir",
              loc: "A-201 Amfi",
              status: "Devam Ediyor",
              statusColor: "bg-[#e6fffa] text-[#319795]",
              borderColor: "border-[#667eea]",
            },
            {
              time: "11:00",
              end: "12:30",
              name: "Yapay Zeka",
              teacher: "Doç. Dr. Ayşe Kara",
              loc: "B-105 Sınıf",
              status: "Yaklaşıyor",
              statusColor: "bg-[#f7fafc] text-[#718096]",
              borderColor: "border-[#a0aec0]",
            },
            {
              time: "14:00",
              end: "15:30",
              name: "Web Programlama",
              teacher: "Dr. Öğr. Üyesi Can Yıldız",
              loc: "C-301 Lab",
              status: "Planlı",
              statusColor: "bg-[#f7fafc] text-[#718096]",
              borderColor: "border-[#a0aec0]",
            },
          ].map((cls, i) => (
            <div
              key={i}
              className={`grid grid-cols-[80px_1fr_auto] gap-4 items-center p-4 bg-[#f7fafc] rounded-lg border-l-4 ${cls.borderColor}`}
            >
              <div className="text-center">
                <p
                  className={`text-xl font-bold ${
                    i === 0 ? "text-[#667eea]" : "text-[#718096]"
                  }`}
                >
                  {cls.time}
                </p>
                <p className="text-xs text-[#718096]">{cls.end}</p>
              </div>
              <div>
                <p className="font-bold text-[#1a202c]">{cls.name}</p>
                <p className="text-sm text-[#718096]">{cls.teacher}</p>
                <p className="text-xs text-[#667eea] mt-1">📍 {cls.loc}</p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${cls.statusColor}`}
              >
                {cls.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
