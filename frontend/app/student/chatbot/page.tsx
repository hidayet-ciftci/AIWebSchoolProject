"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { clearAllChatMessages, useChatMessages } from "@/hooks/useChatMessages";

type CourseOption = {
  _id: string;
  name: string;
  courseCode?: string;
};

export default function ChatbotPage() {
  const router = useRouter();
  const initialAiMessage =
    "Merhaba! Ben AI öğrenme asistanınızım. Size dersleriniz, ödevleriniz veya sınavlarınız hakkında yardımcı olabilirim. Nasıl yardımcı olabilirim?";
  const { messages, setMessages, isStreaming, sendMessageStream } =
    useChatMessages("student", initialAiMessage);
  const [inputText, setInputText] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/");
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadCourses = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/courses/student/my-courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => []);
        if (!res.ok || !Array.isArray(data)) return;

        setCourses(data);
        setSelectedCourseId((current) => current || data[0]?._id || "");
      } catch (error) {
        console.error("Dersler yüklenemedi:", error);
      }
    };

    if (API_URL) {
      loadCourses();
    }
  }, [API_URL]);

  const handleClearChat = () => {
    setMessages([{ role: "ai", text: initialAiMessage }]);
    toast.success("Sohbet geçmişi silindi.");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

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
    setInputText("");

    await sendMessageStream(
      userMessage,
      selectedCourseId,
      `${API_URL}`,
      token,
      undefined,
      (errMsg) => toast.error(errMsg),
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn h-full flex flex-col">
      <h1 className="text-3xl font-bold text-[#1a202c] mb-6">AI Asistan</h1>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden max-h-[600px]">
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
          <div className="ml-auto flex items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Aktif ders
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Genel sohbet</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                    {course.courseCode ? ` (${course.courseCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isStreaming}
              className="ml-auto px-4 py-2 border border-red-200 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              Sohbeti Sil
            </button>
          </div>
        </div>

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
                <p className="leading-relaxed whitespace-pre-wrap break-words">
                  {msg.text}
                  {msg.streaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse" />
                  )}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form
        onSubmit={handleSendMessage}
        className="p-6 border-t border-gray-100 flex gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Mesajınızı yazın..."
          disabled={isStreaming}
          className="flex-1 p-3 border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#667eea] transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isStreaming}
          className="px-6 py-3 bg-linear-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold hover:-translate-y-0.5 transition-transform cursor-pointer disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isStreaming ? "Yanıtlanıyor..." : "Gönder"}
        </button>
      </form>
    </div>
  );
}
