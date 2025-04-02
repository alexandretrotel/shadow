import { Message } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatStore {
  messages: Record<string, Message[]>; // Store messages by recipient
  addMessage: (recipient: string, message: Message) => void;
  updateMessageStatus: (
    recipient: string,
    messageId: string,
    status: Message["status"],
  ) => void;
  clearMessages: (recipient: string) => void;
}

export const useChat = create<ChatStore>()(
  persist(
    (set) => ({
      messages: {},

      addMessage: (recipient: string, message: Message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [recipient]: [...(state.messages[recipient] || []), message],
          },
        })),

      updateMessageStatus: (recipient, messageId, status) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [recipient]: state.messages[recipient]?.map((msg) =>
              msg.messageId === messageId
                ? { ...msg, status, timestamp: new Date().toISOString() }
                : msg,
            ),
          },
        })),

      clearMessages: (recipient: string) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [recipient]: [],
          },
        })),
    }),
    {
      name: "chat-storage",
    },
  ),
);
