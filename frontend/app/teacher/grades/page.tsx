export default function TeacherGradesPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Not Yönetimi</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          "Vize Ort: 78.5",
          "Quiz Ort: 82.3",
          "Ödev Ort: 85.7",
          "Genel: 81.2",
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl shadow-sm text-center border border-gray-100"
          >
            <p className="text-gray-500 text-sm mb-1">{stat.split(":")[0]}</p>
            <p className="text-2xl font-bold text-[#667eea]">
              {stat.split(":")[1]}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f7fafc] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-4">Öğrenci</th>
                <th className="p-4">Vize</th>
                <th className="p-4">Quiz</th>
                <th className="p-4">Ödev</th>
                <th className="p-4">Ortalama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  no: "2023001",
                  name: "Ahmet Yılmaz",
                  v: 80,
                  q: 90,
                  f: 85,
                  avg: 85,
                },
                {
                  no: "2023002",
                  name: "Ayşe Kaya",
                  v: 85,
                  q: 88,
                  f: 92,
                  avg: 88,
                },
                {
                  no: "2023003",
                  name: "Mehmet Özkan",
                  v: 72,
                  q: 75,
                  f: 78,
                  avg: 75,
                },
              ].map((student, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-[#1a202c]">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-500">{student.no}</p>
                  </td>
                  <td className="p-4 font-semibold text-[#1a202c]">
                    {student.v}
                  </td>
                  <td className="p-4 font-semibold text-[#1a202c]">
                    {student.q}
                  </td>
                  <td className="p-4 font-semibold text-[#1a202c]">
                    {student.f}
                  </td>
                  <td className="p-4 font-bold text-[#667eea]">
                    {student.avg}
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
