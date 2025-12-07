import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // 1. Toaster'ı buraya import edin

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Web School",
  description: "Öğrenci Bilgi Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 2. Toaster'ı en tepeye koyuyoruz. Sayfa değişse de bu kalıcıdır. */}
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </body>
    </html>
  );
}
