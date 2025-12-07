"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Yetki kontrolü bitene kadar içeriği göstermemek için bir state
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Token var mı?
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        router.push("/");
        return;
      }

      // 2. Rol kontrolü (Basit check)
      try {
        const user = JSON.parse(userStr);
        if (user.role !== "student") {
          toast.error("Yetkisiz giriş denemesi!");
          setTimeout(() => {
            router.back();
          }, 1000);
          return;
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
        return;
      }

      // 3. TOKEN DOĞRULAMA (Backend ile haberleşme)
      try {
        const res = await fetch("http://localhost:5000/auth/dashboard", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Token'ı header'da gönderiyoruz
          },
        });

        // Eğer sunucu 200 dönmezse (örn: 401 token süresi doldu)
        if (!res.ok) {
          throw new Error("Oturum süresi doldu");
        }

        // Her şey yolunda, içeriği göster
        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        toast.error("Oturum süreniz doldu, lütfen tekrar giriş yapın.");

        // Token geçersizse temizle ve at
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Çıkış yapıldı");
    router.push("/");
  };

  const NavLink = ({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: string;
    label: string;
  }) => {
    const isActive =
      href === "/student" ? pathname === href : pathname.startsWith(href);

    return (
      <Link
        href={href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
          isActive
            ? "bg-[#667eea]/20 text-white"
            : "text-gray-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  // Eğer yetki kontrolü henüz bitmediyse loading gösterebilir veya boş dönebiliriz
  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7fafc]">
        <div className="text-[#667eea] font-semibold text-xl animate-pulse">
          Yükleniyor...
        </div>
      </div>
    );
  }

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
            👨‍🎓
          </div>
          <h2 className="font-semibold text-lg">ahmet</h2>
          <p className="text-gray-400 text-sm">Öğrenci</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavLink href="/student" icon="🏠" label="Anasayfa" />
          <NavLink href="/student/profile" icon="👤" label="Profil" />
          <NavLink href="/student/courses" icon="📚" label="Dersler" />
          <NavLink href="/student/exam" icon="📝" label="Sınavlar" />
          <NavLink href="/student/grades" icon="📊" label="Notlar" />
          <NavLink href="/student/chatbot" icon="🤖" label="ChatBot" />
        </nav>

        <button
          onClick={handleLogout}
          className="w-full p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-semibold mt-4 flex items-center justify-center gap-2 cursor-pointer"
        >
          🚪 Çıkış Yap
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white shadow-sm flex items-center justify-between">
          <h1 className="font-bold text-gray-800">Öğrenci Paneli</h1>
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
