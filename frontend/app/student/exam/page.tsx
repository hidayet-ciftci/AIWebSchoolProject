export const exam = () => {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Sınavlar</h1>
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
              <p className="font-semibold text-[#1a202c]">{exam.name}</p>
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
  );
};
