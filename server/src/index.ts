import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import nacl from "tweetnacl";
import {
  decode as decodeBase64,
  encode as encodeBase64,
} from "@stablelib/base64";

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

const serverNonce = Math.random().toString(36).slice(2);
app.get("/nonce", (_, res) => {
  res.json({ nonce: serverNonce });
});

// Map to store username -> socket ID
const users = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected at ${new Date().toISOString()}`);

  socket.on(
    "register",
    ({ username, publicKey }: { username: string; publicKey: string }) => {
      const decodedKey = decodeBase64(publicKey);
      if (decodedKey.length !== nacl.box.publicKeyLength) {
        socket.emit("error", "Invalid public key length");
        return;
      }
      users.set(username, socket.id);
      socket.handshake.auth = { username, publicKey: decodedKey };
      console.log(`User ${username} registered with socket ${socket.id}`);
    }
  );

  socket.on("checkUsername", ({ username }: { username: string }, callback) => {
    callback({ available: !users.has(username) });
  });

  socket.on(
    "message",
    ({
      recipient,
      encryptedContent,
      timer,
      messageId,
    }: {
      recipient: string;
      encryptedContent: string;
      timer?: number;
      messageId: string;
    }) => {
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
    }
  );

  socket.on(
    "typing",
    ({ recipient, username }: { recipient: string; username: string }) => {
      const recipientSocketId = users.get(recipient);
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit("typing", { username });
      }
    }
  );

  socket.on("messageRead", ({ messageId }: { messageId: string }) => {
    console.log(`Message ${messageId} read by ${socket.id}`);
  });

  socket.on(
    "editMessage",
    ({
      recipient,
      messageId,
      encryptedContent,
    }: {
      recipient: string;
      messageId: string;
      encryptedContent: string;
    }) => {
      const recipientSocketId = users.get(recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("messageEdited", {
          messageId,
          encryptedContent,
        });
      }
    }
  );

  socket.on(
    "deleteMessage",
    ({ recipient, messageId }: { recipient: string; messageId: string }) => {
      const recipientSocketId = users.get(recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("messageDeleted", { messageId });
      }
    }
  );

  socket.on(
    "reactToMessage",
    ({
      recipient,
      messageId,
      reaction,
    }: {
      recipient: string;
      messageId: string;
      reaction: string;
    }) => {
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
    }
  );

  socket.on("requestPublicKey", ({ username }: { username: string }) => {
    const socketId = users.get(username);
    if (socketId) {
      const user = io.sockets.sockets.get(socketId)?.handshake.auth;
      if (user) {
        socket.emit("publicKeys", {
          username,
          publicKey: encodeBase64(user.publicKey),
        });
      }
    }
  });

  socket.on(
    "getOnlineStatus",
    ({ usernames }: { usernames: string[] }, callback) => {
      const status = usernames.map((u) => ({
        username: u,
        online: users.has(u),
      }));
      callback(status);
    }
  );

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
