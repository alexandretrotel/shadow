import { create } from "zustand";
import { type Socket, io } from "socket.io-client";
import { SERVER_URL } from "@/lib/server";
import { useEffect } from "react";
import { useOnline } from "./online.store";
import { useAuth } from "./auth.store";
import {
  debouncedToastError,
  debouncedToastSuccess,
  debouncedToastWarn,
} from "@/lib/debounce";
import { encode } from "@stablelib/base64";

interface SocketStore {
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
  closeSocket: () => void;
  initialize: (username: string) => void;
}

export const useSocket = create<SocketStore>((set, get) => {
  return {
    socket: null,
    setSocket: (socket) => set({ socket }),
    closeSocket: () => {
      get().socket?.disconnect();
    },
    initialize: (publicKey: string) => {
      const socket = io(SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
      });
      set({ socket });

      socket.on("connect", () => {
        if (publicKey) {
          socket.emit("register", publicKey); // Register user on connect
        }
        debouncedToastSuccess("Connected to the server");
      });

      // Reconnect handler
      socket.on("reconnect", () => {
        if (publicKey) {
          socket.emit("register", publicKey); // Register user on reconnect
        }
        debouncedToastSuccess("Reconnected to the server");
      });

      // Reconnect failed handler
      socket.on("reconnect_failed", () => {
        debouncedToastError(
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
          debouncedToastWarn(
            "Disconnected from the server. Attempting to reconnect...",
          );
        }
      });

      // Listen for online users updates
      socket.on("onlinePublicKeys", (publicKeys: string[]) => {
        useOnline.getState().setOnlinePublicKeys(publicKeys);
      });
    },
  };
});

export const useInitializeSocket = () => {
  const { initialize, socket, closeSocket } = useSocket.getState();
  const { getKeyPair } = useAuth();

  useEffect(() => {
    const keyPair = getKeyPair();

    if (keyPair && !socket) {
      const publicKey = encode(keyPair?.publicKey);
      initialize(publicKey);
    }

    return () => {
      if (socket) {
        closeSocket();
      }
    };
  }, [closeSocket, getKeyPair, initialize, socket]);
};
