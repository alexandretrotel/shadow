import type { Server } from "socket.io";
import type { Message } from "../../common/src/types";

interface ConnectedUsers {
  [username: string]: string; // Maps username to socket.id
}

export function setupSockets(io: Server) {
  const connectedUsers: ConnectedUsers = {}; // Store connected users and their socket IDs

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register the user with their username
    socket.on("register", (username: string) => {
      connectedUsers[username] = socket.id;
      console.log(`User registered: ${username} with socket ID: ${socket.id}`);
    });

    // Handle user messages
    socket.on("message", (data: { recipient: string; message: Message }) => {
      const recipientSocketId = connectedUsers[data.recipient]; // Get recipient's socket ID

      if (recipientSocketId) {
        // Send the message to the recipient
        io.to(recipientSocketId).emit("message", {
          ...data.message,
          status: "delivered",
        });
      }
    });

    // Handle user typing events
    socket.on("typing", (data: { recipient: string; username: string }) => {
      const recipientSocketId = connectedUsers[data.recipient]; // Get recipient's socket ID

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing", data.username);
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
          break;
        }
      }
    });
  });
}
