"use client";

import { useEffect, useState } from "react";

export type ChatMessage = {
  role: "user" | "ai";
  text: string;
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
      {
        role: "ai",
        text: initialAiText,
      },
    ];

    if (typeof window === "undefined") {
      return fallbackMessages;
    }

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Chat geçmişi kaydedilemedi:", error);
    }
  }, [messages, storageKey]);

  return {
    messages,
    setMessages,
  };
}
