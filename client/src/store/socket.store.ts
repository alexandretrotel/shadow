import { create } from "zustand";
import { type Socket, io } from "socket.io-client";
import { SERVER_URL } from "@/lib/server";
import { useEffect } from "react";
import { useOnline } from "./online.store";
import { useAuth } from "./auth.store";

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

    // Listen for online users updates
    socket.on("onlineUsers", (users: string[]) => {
      useOnline.getState().setOnlineUsers(users);
    });
  },
}));

export const useInitializeSocket = () => {
  const { initialize, socket } = useSocket.getState();
  const { username } = useAuth();

  useEffect(() => {
    if (!username) return;

    initialize();

    if (socket && username) {
      socket.emit("register", username); // Register the user on connect
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [initialize, socket, username]);
};
