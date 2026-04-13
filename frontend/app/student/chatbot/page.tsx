"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { clearAllChatMessages, useChatMessages } from "@/hooks/useChatMessages";

export default function ChatbotPage() {
  const router = useRouter();
  const initialAiMessage =
    "Merhaba! Ben AI öğrenme asistanınızım. Size dersleriniz, ödevleriniz veya sınavlarınız hakkında yardımcı olabilirim. Nasıl yardımcı olabilirim?";
  const { messages, setMessages } = useChatMessages(
    "student",
    initialAiMessage,
  );
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/");
  }, [router]);

  const handleClearChat = () => {
    setMessages([{ role: "ai", text: initialAiMessage }]);
    toast.success("Sohbet geçmişi silindi.");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const token = localStorage.getItem("token");
    if (!token) {
      clearAllChatMessages();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      router.push("/");
      return;
    }

    const userMessage = inputText.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInputText("");

    try {
      setIsSending(true);
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        clearAllChatMessages();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Oturum süreniz doldu. Lütfen tekrar giriş yapın.");
        router.push("/");
        return;
      }

      if (!res.ok) {
        const msg =
          (data && (data.message || data.error)) ||
          "AI yanıtı alınamadı. Lütfen tekrar deneyin.";
        throw new Error(msg);
      }

      const reply = typeof data?.reply === "string" ? data.reply : "";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: reply || "Şu an yanıt üretemedim, tekrar dener misin?",
        },
      ]);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn h-full flex flex-col">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">AI Asistan</h1>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden max-h-[600px]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-2xl text-white">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-[#1a202c] text-lg">
              AI Öğrenme Asistanı
            </h3>
            <p className="text-sm text-gray-500">
              Size yardımcı olmak için buradayım!
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearChat}
            disabled={isSending}
            className="ml-auto px-4 py-2 border border-red-200 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
          >
            Sohbeti Sil
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f7fafc]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "ai" && (
                <div className="w-9 h-9 bg-linear-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-lg text-white shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`p-4 rounded-xl max-w-[75%] shadow-sm ${
                  msg.role === "user"
                    ? "bg-linear-to-br from-[#667eea] to-[#764ba2] text-white"
                    : "bg-white text-[#1a202c]"
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-6 border-t border-gray-100 flex gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mesajınızı yazın..."
            disabled={isSending}
            className="flex-1 p-3 border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#667eea] transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSending}
            className="px-6 py-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold hover:-translate-y-0.5 transition-transform cursor-pointer disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSending ? "Gönderiliyor..." : "Gönder"}
          </button>
        </form>
      </div>
    </div>
  );
}
