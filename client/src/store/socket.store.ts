import { create } from "zustand";
import { type Socket, io } from "socket.io-client";
import { SERVER_URL } from "@/lib/server";
import { useEffect } from "react";

interface SocketStore {
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
  closeSocket: () => void;
  initialize: () => void;
}

export const useSocket = create<SocketStore>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
  closeSocket: () => {
    set({ socket: null });
  },
  initialize: () => {
    const socket = io(SERVER_URL);
    set({ socket });
    socket.connect();
  },
}));

export const useInitializeSocket = () => {
  const { initialize } = useSocket.getState();

  useEffect(() => {
    initialize();
  }, [initialize]);
};
