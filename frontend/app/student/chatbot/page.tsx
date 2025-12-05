"use client";

import { useState } from "react";

export default function ChatbotPage() {
  // State'leri buraya taşıdık
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Merhaba! Ben AI öğrenme asistanınızım. Size dersleriniz, ödevleriniz veya sınavlarınız hakkında yardımcı olabilirim. Nasıl yardımcı olabilirim?",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: inputText }]);
    const tempInput = inputText;
    setInputText("");

    // Yapay zeka simülasyonu
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `"${tempInput}" konulu sorunu anladım. Size yardımcı olmak için elimden geleni yapacağım.`,
        },
      ]);
    }, 1000);
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
            className="flex-1 p-3 border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#667eea] transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold hover:-translate-y-0.5 transition-transform cursor-pointer"
          >
            Gönder
          </button>
        </form>
      </div>
    </div>
  );
}
