import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatState, Message, Participant } from "@/types/chat";

type ChatStore = ChatState & {
  setRoomName: (roomName: string) => void;
  setUsername: (username: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  setParticipants: (participants: Participant[]) => void;
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
  reset: () => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      roomName: "",
      username: "",
      messages: [],
      participants: [],
      typingUsers: [],
      setRoomName: (roomName) => set((state) => ({ ...state, roomName })),
      setUsername: (username) => set((state) => ({ ...state, username })),
      addMessage: (message) =>
        set((state) => ({
          ...state,
          messages: [...state.messages, message],
        })),
      clearMessages: () => set((state) => ({ ...state, messages: [] })),
      setMessages: (messages) => set((state) => ({ ...state, messages })),
      setParticipants: (participants) =>
        set((state) => ({ ...state, participants })),
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
          roomName: "",
          username: "",
          messages: [],
          participants: [],
          typingUsers: [],
        }),
    }),
    {
      name: "chat-store",
    },
  ),
);
