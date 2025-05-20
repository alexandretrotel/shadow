import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QueueStore {
  isQueueEnabled: boolean;
  setQueueEnabled: (enabled: boolean) => void;
}

export const useQueue = create<QueueStore>()(
  persist(
    (set) => ({
      isQueueEnabled: false,
      setQueueEnabled: (enabled: boolean) => set({ isQueueEnabled: enabled }),
    }),
    {
      name: "queue-storage",
    },
  ),
);
