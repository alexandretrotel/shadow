import type { Server } from "socket.io";
import type { Message } from "../lib/types";

interface ConnectedUsers {
  [publicKey: string]: string; // Maps public key to socket.id
}

interface TypingTimeouts {
  [publicKey: string]: NodeJS.Timeout; // Maps public key to timeout ID
}

export function setupSockets(io: Server) {
  const connectedPublicKeys: ConnectedUsers = {}; // Store connected users and their socket IDs
  const typingTimeouts: TypingTimeouts = {}; // Store typing timeouts

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register the user with their username
    socket.on("register", (publicKey: string) => {
      connectedPublicKeys[publicKey] = socket.id; // Store the user's public key and socket ID
      console.log(`User registered: ${publicKey} with socket ID: ${socket.id}`);

      // Broadcast updated online users list
      io.emit("onlinePublicKeys", Object.keys(connectedPublicKeys));
    });

    // Handle user messages
    socket.on(
      "message",
      (data: { sender: string; recipient: string; message: Message }) => {
        const senderSocketId = connectedPublicKeys[data.sender]; // Get sender's socket ID
        const recipientSocketId = connectedPublicKeys[data.recipient]; // Get recipient's socket ID

        if (senderSocketId) {
          // Confirm the message was sent to the sender
          io.to(senderSocketId).emit("message", {
            ...data.message,
            status: "delivered",
          });
        }

        if (recipientSocketId) {
          // Send the message to the recipient
          io.to(recipientSocketId).emit("message", {
            ...data.message,
            status: "received",
          });
        } else {
          // Notify the sender that the recipient is offline
          io.to(senderSocketId).emit("recipientOffline", {
            recipient: data.recipient,
            messageId: data.message.messageId,
          });
        }
      }
    );

    // Handle user typing events
    socket.on("typing", (data: { sender: string; recipient: string }) => {
      const recipientSocketId = connectedPublicKeys[data.recipient]; // Get recipient's socket ID

      if (recipientSocketId) {
        // Clear any existing timeout for this user
        if (typingTimeouts[data.sender]) {
          clearTimeout(typingTimeouts[data.sender]);
        }

        // Emit typing event to the recipient
        io.to(recipientSocketId).emit("typing", data.sender);

        // Set a timeout to emit stopTyping after 2 seconds of inactivity
        typingTimeouts[data.sender] = setTimeout(() => {
          io.to(recipientSocketId).emit("stopTyping", data.sender);
          delete typingTimeouts[data.sender];
        }, 2000); // 2 seconds of inactivity
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove the disconnected user from the connectedUsers map
      for (const publicKey in connectedPublicKeys) {
        if (connectedPublicKeys[publicKey] === socket.id) {
          delete connectedPublicKeys[publicKey];
          console.log(`User ${publicKey} removed from connected users.`);

          // Broadcast updated online users list
          io.emit("onlinePublicKeys", Object.keys(connectedPublicKeys));

          // Clear any existing typing timeout for this user
          if (typingTimeouts[publicKey]) {
            clearTimeout(typingTimeouts[publicKey]);
            delete typingTimeouts[publicKey];
          }

          break;
        }
      }
    });
  });
}
