export default function TeacherProfilePage() {
  return (
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
  );
}
