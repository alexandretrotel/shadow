import { Message } from "@shared/src/types";
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
            [recipient]: [...(state.messages[recipient] || []), message],
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
