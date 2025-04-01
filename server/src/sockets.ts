import type { Server } from "socket.io";
import type { Message } from "@shared/src/types";

export function setupSockets(io: Server) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("message", (data: { recipient: string; message: Message }) => {
      io.to(data.recipient).emit("message", data.message);
    });

    socket.on("typing", (data: { roomId: string; username: string }) => {
      socket.to(data.roomId).emit("typing", data.username);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
