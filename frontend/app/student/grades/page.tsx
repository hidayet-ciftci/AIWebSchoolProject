export default function GradesPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Notlarım</h1>
      <div className="space-y-6">
        {[
          {
            name: "Veri Yapıları",
            score: 85,
            detail: "Vize: 80 | Quiz: 90 | Ödev: 85",
          },
          {
            name: "Yapay Zeka",
            score: 92,
            detail: "Vize: 88 | Quiz: 95 | Ödev: 93",
          },
          {
            name: "Web Programlama",
            score: 88,
            detail: "Vize: 85 | Quiz: 90 | Proje: 90",
          },
        ].map((grade, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1a202c]">{grade.name}</h3>
              <span className="text-2xl font-bold text-[#667eea]">
                {grade.score}
              </span>
            </div>
            <div className="w-full bg-[#f7fafc] rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-linear-to-r from-[#667eea] to-[#764ba2] h-full rounded-full"
                style={{ width: `${grade.score}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{grade.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
