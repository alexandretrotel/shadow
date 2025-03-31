import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (_, res) => {
  res.status(200).send("OK");
});

const rooms = new Map<string, { password: string; sockets: string[] }>();

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ roomName, password, username, publicKey }) => {
    // Check if the room exists and if not, create it
    if (!rooms.has(roomName)) {
      rooms.set(roomName, { password, sockets: [] });
    }

    // Check if the room password is correct
    if (rooms.get(roomName)?.password === password) {
      socket.join(roomName);
      rooms.get(roomName)?.sockets.push(socket.id);
      io.to(roomName).emit("publicKeys", { username, publicKey });
    } else {
      socket.emit("error", "Invalid password");
    }
  });

  socket.on("message", ({ roomName, encryptedContent, timer }) => {
    // Send the encrypted message to all sockets in the room
    io.to(roomName).emit("message", {
      sender: socket.id,
      encryptedContent,
      timer,
    });
  });

  socket.on("disconnect", () => {
    // Remove the socket from all rooms it was in
    for (const [roomName, data] of rooms) {
      data.sockets = data.sockets.filter((id) => id !== socket.id);
      if (data.sockets.length === 0) rooms.delete(roomName);
    }
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
