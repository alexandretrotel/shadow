import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

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

// Map to store username -> socket ID
const users = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected at ${new Date().toISOString()}`);

  socket.on("register", ({ username, publicKey }) => {
    users.set(username, socket.id);
    console.log(`User ${username} registered with socket ${socket.id}`);
    // Broadcast public key to all connected users
    socket.broadcast.emit("publicKeys", { username, publicKey });
  });

  socket.on("message", ({ recipient, encryptedContent, timer, messageId }) => {
    const recipientSocketId = users.get(recipient);
    if (recipientSocketId) {
      console.log(`Message from ${socket.id} to ${recipient}:`, {
        messageId,
        timer,
      });
      io.to(recipientSocketId).emit("message", {
        sender: Array.from(users.entries()).find(
          ([_, id]) => id === socket.id
        )?.[0],
        encryptedContent,
        timer,
        messageId,
      });
    } else {
      socket.emit("error", `User ${recipient} not found`);
    }
  });

  socket.on("typing", ({ recipient, username }) => {
    const recipientSocketId = users.get(recipient);
    if (recipientSocketId) {
      socket.to(recipientSocketId).emit("typing", { username });
    }
  });

  socket.on("messageRead", ({ messageId }) => {
    console.log(`Message ${messageId} read by ${socket.id}`);
  });

  socket.on("editMessage", ({ recipient, messageId, encryptedContent }) => {
    const recipientSocketId = users.get(recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("messageEdited", {
        messageId,
        encryptedContent,
      });
    }
  });

  socket.on("deleteMessage", ({ recipient, messageId }) => {
    const recipientSocketId = users.get(recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("messageDeleted", { messageId });
    }
  });

  socket.on("reactToMessage", ({ recipient, messageId, reaction }) => {
    const recipientSocketId = users.get(recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("messageReaction", {
        messageId,
        sender: Array.from(users.entries()).find(
          ([_, id]) => id === socket.id
        )?.[0],
        reaction,
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
    const username = Array.from(users.entries()).find(
      ([_, id]) => id === socket.id
    )?.[0];
    if (username) {
      users.delete(username);
    }
  });

  socket.on("connect_error", (err) => {
    console.error(`Socket ${socket.id} connect_error: ${err.message}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
