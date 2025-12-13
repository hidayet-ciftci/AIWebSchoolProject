"use client";

export default function AdminDashboard() {
  return (
    <div className="animate-fadeIn space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a202c] mb-2">
            Yönetim Paneli
          </h1>
          <p className="text-[#718096]">Sistem genel durumu ve istatistikler</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "👨‍🎓",
            label: "Toplam Öğrenci",
            value: "1,240",
            color: "from-blue-500 to-blue-600",
          },
          {
            icon: "👨‍🏫",
            label: "Toplam Öğretmen",
            value: "45",
            color: "from-purple-500 to-purple-600",
          },
          {
            icon: "📚",
            label: "Aktif Dersler",
            value: "32",
            color: "from-green-500 to-green-600",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform"
          >
            <div
              className={`w-14 h-14 rounded-full bg-linear-to-br ${stat.color} flex items-center justify-center text-3xl text-white shadow-md`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1a202c]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#1a202c] mb-6">Son Kayıtlar</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f7fafc] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-4">Ad Soyad</th>
                <th className="p-4">Rol</th>
                <th className="p-4">E-posta</th>
                <th className="p-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  name: "Ali Veli",
                  role: "Öğrenci",
                  email: "ali@obs.com",
                  status: "Aktif",
                },
                {
                  name: "Ayşe Yılmaz",
                  role: "Öğretmen",
                  email: "ayse@obs.com",
                  status: "Aktif",
                },
                {
                  name: "Mehmet Öz",
                  role: "Öğrenci",
                  email: "mehmet@obs.com",
                  status: "Beklemede",
                },
              ].map((user, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-[#1a202c]">
                    {user.name}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        user.role === "Öğretmen"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4 text-green-600 font-medium">
                    {user.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
