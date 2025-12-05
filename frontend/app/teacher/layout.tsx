"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => router.push("/");

  const NavLink = ({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: string;
    label: string;
  }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
          isActive
            ? "bg-[#667eea]/20 text-white"
            : "text-gray-400 hover:bg-white/10"
        }`}
      >
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#f7fafc] overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 w-[280px] h-full bg-linear-to-b from-[#1a202c] to-[#2d3748] p-6 flex flex-col text-white transition-transform duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-br from-[#667eea] to-[#764ba2] rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg">
            👨‍🏫
          </div>
          <h2 className="font-semibold text-lg">Prof. Dr. Mehmet Demir</h2>
          <p className="text-gray-400 text-sm">Öğretmen</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavLink href="/teacher/profile" icon="👤" label="Profil" />
          <NavLink href="/teacher/courses" icon="📚" label="Dersler" />
          <NavLink href="/teacher/exams" icon="📝" label="Sınavlar" />
          <NavLink href="/teacher/grades" icon="📊" label="Notlar" />
          <NavLink href="/teacher/chatbot" icon="🤖" label="ChatBot" />
        </nav>

        <button
          onClick={handleLogout}
          className="w-full p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-semibold mt-4 cursor-pointer"
        >
          🚪 Çıkış Yap
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white shadow-sm flex items-center justify-between">
          <h1 className="font-bold text-gray-800">Öğretmen Paneli</h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-2xl"
          >
            ☰
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
