import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatState, Message, Participant } from "@/types/chat";
import { encode as encodeBase64 } from "@stablelib/base64";
import { useEffect } from "react";

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
  serverNonce: string;
  setServerNonce: (nonce: string) => void;
  reset: () => void;
  seenMessageIds: Set<string>;
  addSeenMessageId: (id: string) => void;
  initialize: () => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      username: "",
      messages: [],
      typingUsers: [],
      currentRecipient: "",
      contacts: [],
      serverNonce: "",
      seenMessageIds: new Set<string>(),
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
      setServerNonce: (nonce) =>
        set((state) => ({ ...state, serverNonce: nonce })),
      addSeenMessageId: (id) =>
        set((state) => ({
          ...state,
          seenMessageIds: new Set([...state.seenMessageIds, id]),
        })),
      reset: () =>
        set({
          username: "",
          messages: [],
          typingUsers: [],
          currentRecipient: "",
          contacts: [],
          seenMessageIds: new Set<string>(),
        }),
      initialize: () => {
        fetch("/nonce")
          .then((res) => res.json())
          .then(({ nonce }) => {
            const state = useChatStore.getState();
            if (state.serverNonce && state.serverNonce !== nonce) {
              state.reset();
            }
            state.setServerNonce(nonce);
          });
      },
    }),
    {
      name: "chat-store",
      partialize: (state) => ({
        contacts: state.contacts.map((c) => ({
          username: c.username,
          publicKey: encodeBase64(c.publicKey),
        })),
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<ChatStore>;
        return {
          ...current,
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

export const useInitialize = () => {
  const initialize = useChatStore((state) => state.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
};
