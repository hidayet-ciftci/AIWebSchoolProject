export const courses = () => {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">Derslerim</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: "💻",
            name: "Veri Yapıları",
            teacher: "Prof. Dr. Mehmet Demir",
            total: "24 Ders",
            status: "Devam Ediyor",
          },
          {
            icon: "🤖",
            name: "Yapay Zeka",
            teacher: "Doç. Dr. Ayşe Kara",
            total: "18 Ders",
            status: "Devam Ediyor",
          },
          {
            icon: "🌐",
            name: "Web Programlama",
            teacher: "Dr. Öğr. Üyesi Can Yıldız",
            total: "20 Ders",
            status: "Devam Ediyor",
          },
        ].map((course, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform duration-300"
          >
            <div className="text-3xl mb-4">{course.icon}</div>
            <h3 className="text-xl font-bold text-[#1a202c] mb-2">
              {course.name}
            </h3>
            <p className="text-gray-500 mb-4">{course.teacher}</p>
            <div className="flex justify-between items-center">
              <span className="text-[#667eea] font-semibold">
                {course.total}
              </span>
              <span className="bg-[#e6fffa] text-[#319795] px-3 py-1 rounded-full text-sm font-bold">
                {course.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
