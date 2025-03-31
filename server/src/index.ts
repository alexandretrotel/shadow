import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { Room } from "./types";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

app.get("/", (_, res) => {
  res.send("Server is running");
});

const rooms = new Map<string, Room>();

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected at ${new Date().toISOString()}`);

  socket.on("joinRoom", ({ roomName, password, username, publicKey }) => {
    console.log(`Join attempt by ${socket.id}:`, {
      roomName,
      username,
      publicKey,
    });
    if (!rooms.has(roomName)) {
      console.log(`Creating new room: ${roomName}`);
      rooms.set(roomName, { password, sockets: [] });
    }
    const room = rooms.get(roomName);
    if (!room) {
      console.log(`Room ${roomName} not found for ${socket.id}`);
      socket.emit("error", "Room not found");
      return;
    }
    if (room.password !== password) {
      console.log(`Invalid password for ${roomName} by ${socket.id}`);
      socket.emit("error", "Invalid password");
      return;
    }
    socket.join(roomName);
    room.sockets.push(socket.id);
    console.log(
      `Socket ${socket.id} joined room ${roomName}. Room sockets:`,
      room.sockets
    );
    io.to(roomName).emit("publicKeys", { username, publicKey });
  });

  socket.on("message", ({ roomName, encryptedContent, timer, messageId }) => {
    console.log(`Message from ${socket.id} in ${roomName}:`, {
      messageId,
      timer,
    });
    io.to(roomName).emit("message", {
      sender: socket.id,
      encryptedContent,
      timer,
      messageId,
    });
  });

  socket.on("typing", ({ roomName, username }) => {
    console.log(`${socket.id} typing in ${roomName} as ${username}`);
    socket.to(roomName).emit("typing", { username });
  });

  socket.on("messageRead", ({ roomName, messageId }) => {
    console.log(`Message ${messageId} read in ${roomName} by ${socket.id}`);
    io.to(roomName).emit("messageStatus", { messageId, status: "read" });
  });

  socket.on("editMessage", ({ roomName, messageId, encryptedContent }) => {
    console.log(`Edit message ${messageId} in ${roomName} by ${socket.id}`);
    io.to(roomName).emit("messageEdited", { messageId, encryptedContent });
  });

  socket.on("deleteMessage", ({ roomName, messageId }) => {
    console.log(`Delete message ${messageId} in ${roomName} by ${socket.id}`);
    io.to(roomName).emit("messageDeleted", { messageId });
  });

  socket.on("reactToMessage", ({ roomName, messageId, reaction }) => {
    console.log(
      `Reaction to ${messageId} in ${roomName} by ${socket.id}: ${reaction}`
    );
    io.to(roomName).emit("messageReaction", {
      messageId,
      sender: socket.id,
      reaction,
    });
  });

  socket.on("leaveRoom", ({ roomName }) => {
    console.log(`Socket ${socket.id} leaving room ${roomName}`);
    socket.leave(roomName);
    const room = rooms.get(roomName);
    if (room) {
      room.sockets = room.sockets.filter((id) => id !== socket.id);
      console.log(`Room ${roomName} sockets after leave:`, room.sockets);
      if (room.sockets.length === 0) {
        console.log(`Deleting empty room ${roomName}`);
        rooms.delete(roomName);
      }
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `Socket ${socket.id} disconnected at ${new Date().toISOString()}. Reason: ${reason}`
    );
    for (const [roomName, room] of rooms) {
      room.sockets = room.sockets.filter((id) => id !== socket.id);
      if (room.sockets.length === 0) {
        console.log(`Deleting empty room ${roomName} on disconnect`);
        rooms.delete(roomName);
      }
    }
  });

  socket.on("connect_error", (err) => {
    console.error(`Socket ${socket.id} connect_error: ${err.message}`);
  });

  socket.on("connect_timeout", () => {
    console.error(`Socket ${socket.id} connect_timeout`);
  });

  socket.on("error", (err) => {
    console.error(`Socket ${socket.id} error: ${err}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
