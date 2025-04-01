import { create } from "zustand";
import { type Socket, io } from "socket.io-client";
import { SERVER_URL } from "@/lib/server";

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

export const initializeSocket = () => {
  const { initialize } = useSocket.getState();
  initialize();
};
