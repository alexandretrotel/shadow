import { create } from "zustand";

interface OnlineStore {
  onlinePublicKeys: string[];
  setOnlinePublicKeys: (publicKeys: string[]) => void;
  isOnline: (publicKey: string | undefined) => boolean;
}

export const useOnline = create<OnlineStore>((set, get) => ({
  onlinePublicKeys: [],

  setOnlinePublicKeys: (publicKeys: string[]) =>
    set({ onlinePublicKeys: publicKeys }),

  isOnline: (publicKey: string | undefined) => {
    if (!publicKey) return false;
    return get().onlinePublicKeys.includes(publicKey);
  },
}));
