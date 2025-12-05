export default function profilePage() {
  return (
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
          <button className="px-8 py-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold">
            Güncelle
          </button>
        </div>
      </div>
    </div>
  );
}
