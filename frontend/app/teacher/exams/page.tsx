export default function TeacherExamsPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Sınav Yönetimi</h1>
      <button className="mb-6 px-6 py-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold hover:-translate-y-0.5 transition-transform">
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
              <p className="font-semibold text-[#1a202c]">{exam.name}</p>
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
  );
}
