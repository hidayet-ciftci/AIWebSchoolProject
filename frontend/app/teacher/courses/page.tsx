export default function TeacherCoursesPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Derslerim</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: "💻",
            name: "Veri Yapıları",
            detail: "3. Sınıf - Bahar Dönemi",
            studentCount: "45 Öğrenci",
          },
          {
            icon: "⚙️",
            name: "Algoritma Analizi",
            detail: "4. Sınıf - Bahar Dönemi",
            studentCount: "32 Öğrenci",
          },
        ].map((course, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform"
          >
            <div className="text-3xl mb-4">{course.icon}</div>
            <h3 className="text-xl font-bold text-[#1a202c] mb-2">
              {course.name}
            </h3>
            <p className="text-gray-500 mb-4">{course.detail}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#667eea] font-semibold">
                {course.studentCount}
              </span>
              <span className="bg-[#e6fffa] text-[#319795] px-3 py-1 rounded-full text-sm font-bold">
                Aktif
              </span>
            </div>
            <button className="w-full py-2 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold">
              Derse Git
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
