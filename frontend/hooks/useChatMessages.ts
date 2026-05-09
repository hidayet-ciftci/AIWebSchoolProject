"use client";

import { useEffect, useState } from "react";

export type ChatMessage = {
  role: "user" | "ai";
  text: string;
  streaming?: boolean;
};

export type RagMeta = {
  used: boolean;
  reason: string;
  sourceCount: number;
  sources: string[];
};

const CHAT_STORAGE_PREFIX = "chat_history_";
const CHAT_ROLES = ["student", "teacher", "admin"] as const;

export function clearAllChatMessages() {
  if (typeof window === "undefined") return;

  CHAT_ROLES.forEach((role) => {
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${role}`);
  });
}

export function useChatMessages(
  role: (typeof CHAT_ROLES)[number],
  initialAiText: string,
) {
  const storageKey = `${CHAT_STORAGE_PREFIX}${role}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const fallbackMessages: ChatMessage[] = [
      { role: "ai", text: initialAiText },
    ];

    if (typeof window === "undefined") return fallbackMessages;

    try {
      const savedMessages = localStorage.getItem(storageKey);
      if (!savedMessages) return fallbackMessages;

      const parsedMessages = JSON.parse(savedMessages);
      if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
        return parsedMessages;
      }
    } catch (error) {
      console.error("Chat geçmişi yüklenemedi:", error);
    }

    return fallbackMessages;
  });

  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Don't persist messages with streaming flag still set
    const toSave = messages.map((m) => ({ role: m.role, text: m.text }));
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (error) {
      console.error("Chat geçmişi kaydedilemedi:", error);
    }
  }, [messages, storageKey]);

  /**
   * Send a message using Server-Sent Events (streaming).
   * Tokens arrive one-by-one and are appended to the last AI message.
   */
  async function sendMessageStream(
    message: string,
    courseId: string,
    apiUrl: string,
    token: string,
    onRagMeta?: (meta: RagMeta) => void,
    onError?: (msg: string) => void,
  ) {
    const userMessage = message.trim();
    if (!userMessage || isStreaming) return;

    // Append user message
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    // Add empty AI message placeholder (streaming)
    setMessages((prev) => [...prev, { role: "ai", text: "", streaming: true }]);
    setIsStreaming(true);

    const payload = courseId
      ? { message: userMessage, courseId }
      : { message: userMessage };

    try {
      const response = await fetch(`${apiUrl}/chat/stream`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        const msg =
          data?.message ||
          `Sunucu hatası (${response.status}). Tekrar deneyin.`;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { role: "ai", text: msg };
          }
          return updated;
        });
        onError?.(msg);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          // Per SSE spec: strip exactly one leading space after "data:" — preserve the rest
          const raw = trimmed.slice(5);
          const data = raw.startsWith(" ") ? raw.slice(1) : raw;

          if (data.startsWith("[META]")) {
            try {
              const meta: RagMeta = JSON.parse(data.slice(6).trim());
              onRagMeta?.(meta);
            } catch {}
            continue;
          }

          if (data === "[DONE]") break;

          if (data.startsWith("[ERROR]")) {
            const errMsg = data.slice(7).trim();
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.streaming) {
                updated[updated.length - 1] = {
                  role: "ai",
                  text: errMsg || "Bir hata oluştu.",
                };
              }
              return updated;
            });
            onError?.(errMsg);
            return;
          }

          // Normal token — append to last AI message
          // Unescape newlines that were escaped for SSE framing
          const token = data.replace(/\\n/g, "\n");
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.streaming) {
              updated[updated.length - 1] = {
                role: "ai",
                text: last.text + token,
                streaming: true,
              };
            }
            return updated;
          });
        }
      }

      // Finalise — remove streaming flag
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = {
            role: "ai",
            text: last.text || "Şu an yanıt üretemedim, tekrar dener misin?",
          };
        }
        return updated;
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = { role: "ai", text: msg };
        }
        return updated;
      });
      onError?.(msg);
    } finally {
      setIsStreaming(false);
    }
  }

  return {
    messages,
    setMessages,
    isStreaming,
    sendMessageStream,
  };
}
