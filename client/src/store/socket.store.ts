import { create } from "zustand";
import { type Socket, io } from "socket.io-client";
import { SERVER_URL } from "@/lib/server";
import { useEffect } from "react";
import { useOnline } from "./online.store";
import { useAuth } from "./auth.store";
import { toast } from "sonner";

interface SocketStore {
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
  closeSocket: () => void;
  initialize: (username: string) => void;
}

export const useSocket = create<SocketStore>((set, get) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
  closeSocket: () => {
    get().socket?.disconnect();
  },
  initialize: (username: string) => {
    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });
    set({ socket });

    socket.on("connect", () => {
      if (username) {
        socket.emit("register", username); // Register user on connect
      }
      toast.success("Connected to the server");
    });

    // Reconnect handler
    socket.on("reconnect", () => {
      if (username) {
        socket.emit("register", username); // Register user on reconnect
      }
      toast.success("Reconnected to the server");
    });

    // Reconnect failed handler
    socket.on("reconnect_failed", () => {
      toast.error(
        "Failed to reconnect to the server. Please refresh the page.",
      );
    });

    // Disconnect handler
    socket.on("disconnect", (reason) => {
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      ) {
        // Manual disconnect, don’t attempt to reconnect
        set({ socket: null });
      } else {
        toast.warning(
          "Disconnected from the server. Attempting to reconnect...",
        );
      }
    });

    // Listen for online users updates
    socket.on("onlineUsers", (users: string[]) => {
      useOnline.getState().setOnlineUsers(users);
    });
  },
}));

export const useInitializeSocket = () => {
  const { initialize, socket, closeSocket } = useSocket.getState();
  const { username } = useAuth();

  useEffect(() => {
    if (username && !socket) {
      initialize(username);
    }

    return () => {
      if (socket) {
        closeSocket();
      }
    };
  }, [closeSocket, initialize, socket, username]);
};
