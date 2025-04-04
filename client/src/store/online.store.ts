import { create } from "zustand";

interface OnlineStore {
  onlinePublicKeys: string[];
  setOnlinePublicKeys: (publicKeys: string[]) => void;
  isOnline: (publicKey: string) => boolean;
}

export const useOnline = create<OnlineStore>((set, get) => ({
  onlinePublicKeys: [],

  setOnlinePublicKeys: (publicKeys: string[]) =>
    set({ onlinePublicKeys: publicKeys }),

  isOnline: (publicKey: string) => {
    return get().onlinePublicKeys.includes(publicKey);
  },
}));
