import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatState, Message, Participant } from "@/types/chat";
import { encode as encodeBase64 } from "@stablelib/base64";

type ChatStore = ChatState & {
  currentRecipient: string;
  contacts: Participant[];
  setUsername: (username: string) => void;
  setCurrentRecipient: (recipient: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  addContact: (contact: Participant) => void;
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
  reset: () => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      username: "",
      messages: [],
      typingUsers: [],
      currentRecipient: "",
      contacts: [],
      setUsername: (username) => set((state) => ({ ...state, username })),
      setCurrentRecipient: (recipient) =>
        set((state) => ({ ...state, currentRecipient: recipient })),
      addMessage: (message) =>
        set((state) => ({
          ...state,
          messages: [...state.messages, message],
        })),
      clearMessages: () => set((state) => ({ ...state, messages: [] })),
      setMessages: (messages) => set((state) => ({ ...state, messages })),
      addContact: (contact) =>
        set((state) => ({
          ...state,
          contacts: state.contacts.some((c) => c.username === contact.username)
            ? state.contacts
            : [...state.contacts, contact],
        })),
      addTypingUser: (username) =>
        set((state) => ({
          ...state,
          typingUsers: [...new Set([...state.typingUsers, username])],
        })),
      removeTypingUser: (username) =>
        set((state) => ({
          ...state,
          typingUsers: state.typingUsers.filter((u) => u !== username),
        })),
      reset: () =>
        set({
          username: "",
          messages: [],
          typingUsers: [],
          currentRecipient: "",
          contacts: [],
        }),
    }),
    {
      name: "chat-store",
      partialize: (state) => ({
        username: state.username,
        contacts: state.contacts.map((c) => ({
          username: c.username,
          publicKey:
            c.publicKey instanceof Uint8Array
              ? encodeBase64(c.publicKey)
              : c.publicKey,
        })),
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<ChatStore>;
        return {
          ...current,
          ...persistedState,
          contacts:
            persistedState.contacts?.map((c) => ({
              username: c.username,
              publicKey: c.publicKey,
            })) || [],
        };
      },
    },
  ),
);
