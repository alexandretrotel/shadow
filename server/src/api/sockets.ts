import type { Server } from "socket.io";
import type { Message } from "../lib/types";

interface ConnectedUsers {
  [username: string]: string; // Maps username to socket.id
}

interface TypingTimeouts {
  [username: string]: NodeJS.Timeout; // Maps username to timeout ID
}

export function setupSockets(io: Server) {
  const connectedUsers: ConnectedUsers = {}; // Store connected users and their socket IDs
  const typingTimeouts: TypingTimeouts = {}; // Store typing timeouts

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register the user with their username
    socket.on("register", (username: string) => {
      connectedUsers[username] = socket.id;
      console.log(`User registered: ${username} with socket ID: ${socket.id}`);

      // Broadcast updated online users list
      io.emit("onlineUsers", Object.keys(connectedUsers));
    });

    // Handle user messages
    socket.on("message", (data: { username: string; message: Message }) => {
      const usernameSocketId = connectedUsers[data.username]; // Get sender's socket ID

      if (usernameSocketId) {
        // Send the message to the recipient
        io.to(usernameSocketId).emit("message", {
          ...data.message,
          status: "delivered",
        });
      }
    });

    // Handle user typing events
    socket.on("typing", (data: { username: string; recipient: string }) => {
      const recipientSocketId = connectedUsers[data.recipient]; // Get recipient's socket ID

      if (recipientSocketId) {
        // Clear any existing timeout for this user
        if (typingTimeouts[data.username]) {
          clearTimeout(typingTimeouts[data.username]);
        }

        // Emit typing event to the recipient
        io.to(recipientSocketId).emit("typing", data.username);

        // Set a timeout to emit stopTyping after 2 seconds of inactivity
        typingTimeouts[data.username] = setTimeout(() => {
          io.to(recipientSocketId).emit("stopTyping", data.username);
          delete typingTimeouts[data.username];
        }, 2000); // 2 seconds of inactivity
      }
    });

    // Handle reading events
    socket.on("read", (data: { messageId: string; sender: string }) => {
      const senderSocketId = connectedUsers[data.sender]; // Get sender's socket ID

      if (senderSocketId) {
        io.to(senderSocketId).emit("read", data.messageId);
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove the disconnected user from the connectedUsers map
      for (const username in connectedUsers) {
        if (connectedUsers[username] === socket.id) {
          delete connectedUsers[username];
          console.log(`User ${username} removed from connected users.`);

          // Broadcast updated online users list
          io.emit("onlineUsers", Object.keys(connectedUsers));

          // Clear any existing typing timeout for this user
          if (typingTimeouts[username]) {
            clearTimeout(typingTimeouts[username]);
            delete typingTimeouts[username];
          }

          break;
        }
      }
    });
  });
}
