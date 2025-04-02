import { create } from "zustand";

interface OnlineStore {
  onlineUsers: string[];
  setOnlineUsers: (users: string[]) => void;
  isOnline: (username: string) => boolean;
}

export const useOnline = create<OnlineStore>((set, get) => ({
  onlineUsers: [],

  setOnlineUsers: (users: string[]) => set({ onlineUsers: users }),

  isOnline: (username: string) => {
    return get().onlineUsers.includes(username);
  },
}));
