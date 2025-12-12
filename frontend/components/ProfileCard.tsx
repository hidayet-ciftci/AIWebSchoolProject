"use client";

// TypeScript kullandığın için gelen verinin tipini tanımlıyoruz
interface UserProfile {
  name: string;
  surname: string;
  age: number;
  gender: string;
  email: string;
  role: string;
  studentNo?: number; // Sadece öğrencide var, o yüzden opsiyonel (?)
  sicilNo?: string; // Sadece öğretmende var
}

export default function ProfileCard({ data }: { data: UserProfile }) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ortak Alanlar */}
        <InfoItem label="Ad" value={data.name} />
        <InfoItem label="Soyad" value={data.surname} />
        <InfoItem label="Yaş" value={data.age} />
        <InfoItem
          label="Cinsiyet"
          value={data.gender === "male" ? "Erkek" : "Kadın"}
        />

        {/* Rol Bazlı Farklılaşan Alanlar */}
        {data.role === "student" && (
          <InfoItem label="Öğrenci No" value={data.studentNo} />
        )}

        {data.role === "teacher" && (
          <InfoItem label="Sicil No" value={data.sicilNo} />
        )}

        <InfoItem label="E-posta" value={data.email} />
      </div>
    </div>
  );
}

// Küçük bir yardımcı bileşen (Kod tekrarını iyice azaltmak için)
function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        {label}
      </label>
      <p className="text-base text-[#1a202c] p-3 bg-[#f7fafc] rounded-lg">
        {value}
      </p>
    </div>
  );
}
