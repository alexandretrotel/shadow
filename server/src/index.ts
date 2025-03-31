import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { Room } from "./types";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

app.get("/", (_, res) => {
  res.send("Server is running");
});

const rooms = new Map<string, Room>();

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on("joinRoom", ({ roomName, password, username, publicKey }) => {
    if (!rooms.has(roomName)) {
      rooms.set(roomName, { password, sockets: [] });
    }
    const room = rooms.get(roomName);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    if (room?.password !== password) {
      socket.emit("error", "Invalid password");
      return;
    }
    socket.join(roomName);
    room.sockets.push(socket.id);
    io.to(roomName).emit("publicKeys", { username, publicKey });
  });

  socket.on("message", ({ roomName, encryptedContent, timer, messageId }) => {
    io.to(roomName).emit("message", {
      sender: socket.id,
      encryptedContent,
      timer,
      messageId,
    });
  });

  socket.on("typing", ({ roomName, username }) => {
    socket.to(roomName).emit("typing", { username });
  });

  socket.on("leaveRoom", ({ roomName }) => {
    socket.leave(roomName);
    const room = rooms.get(roomName);
    if (room) {
      room.sockets = room.sockets.filter((id) => id !== socket.id);
      if (room.sockets.length === 0) rooms.delete(roomName);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    for (const [roomName, room] of rooms) {
      room.sockets = room.sockets.filter((id) => id !== socket.id);
      if (room.sockets.length === 0) rooms.delete(roomName);
    }
  });

  socket.on("error", (err) => console.error(`Socket error: ${err}`));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
