import { Message } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatStore {
  messages: Record<string, Message[]>; // Store messages by recipient
  addMessage: (recipient: string, message: Message) => void;
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
            [recipient]: [
              // Check if a message with the same ID exists and replace it
              ...(state.messages[recipient] || []).filter(
                (m) => m.messageId !== message.messageId,
              ),
              message, // Add the new or updated message
            ],
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
