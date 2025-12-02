import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black">
      <h1 className="text-4xl font-bold mb-6">
        AI School Projesine Hoşgeldiniz
      </h1>
      <p className="text-lg mb-8 text-gray-600">
        Öğrenci ve Öğretmen Yönetim Sistemi
      </p>

      <div className="flex gap-4">
        {/* Giriş Yap Butonu */}
        <Link
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Giriş Yap
        </Link>

        {/* Kayıt Ol Butonu */}
        <Link
          href="/register"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Kayıt Ol
        </Link>
      </div>
    </div>
  );
}
