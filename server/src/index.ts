import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import nacl from "tweetnacl";
import { decode as decodeBase64 } from "@stablelib/base64";
import "dotenv/config";
import { z } from "zod";

const app = express();
app.use(express.json());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://shadow.alexandretrotel.org"
        : "*",
    methods: ["GET", "POST"],
  },
});

// In-memory map for active socket IDs
const activeUsers = new Map<string, string>(); // username -> socket.id

// Middleware to verify socket connection
io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) return next(new Error("Authentication required"));
  next();
});

// Routes
app.get("/", (_, res) => {
  res.status(200).send("Server is running");
});

// User Registration
const unvalidatedBody = z.object({
  username: z.string(),
  publicKey: z.string(),
});

app.post("/register", async (req, res) => {
  const { username, publicKey } = unvalidatedBody.parse(req.body);
  if (!username || !publicKey) {
    res.status(400).json({ error: "Missing username or publicKey" });
    return;
  }

  const decodedKey = decodeBase64(publicKey);
  if (decodedKey.length !== nacl.box.publicKeyLength) {
    res.status(400).json({ error: "Invalid public key length" });
    return;
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing.length > 0) {
    if (existing[0].publicKey !== publicKey) {
      res.status(409).json({ error: "Username taken with different key" });
      return;
    }
    res.status(200).json({ message: "User already registered" });
    return;
  }

  await db.insert(users).values({ username, publicKey });
  res.status(201).json({ message: "User registered" });
});

// Check Username Availability
const unvalidatedUsernameParams = z.object({
  username: z.string(),
});

app.get("/username/:username", async (req, res) => {
  const { username } = unvalidatedUsernameParams.parse(req.params);
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  res.status(200).json({ available: existing.length === 0 });
});

// Get Public Key
const unvalidatedPublicKeyParams = z.object({
  username: z.string(),
});

app.get("/publicKey/:username", async (req, res) => {
  const { username } = unvalidatedPublicKeyParams.parse(req.params);
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (user.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ publicKey: user[0].publicKey });
});

// Socket.IO Real-Time Logic
io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected at ${new Date().toISOString()}`);
  const username = socket.handshake.auth.username;
  activeUsers.set(username, socket.id);

  socket.on(
    "message",
    async ({
      recipient,
      encryptedContent,
      timer,
      messageId,
    }: {
      recipient: string;
      encryptedContent: string;
      timer: number;
      messageId: string;
    }) => {
      const recipientUser = await db
        .select()
        .from(users)
        .where(eq(users.username, recipient))
        .limit(1);
      if (recipientUser.length === 0) {
        socket.emit("error", `User ${recipient} not found`);
        return;
      }
      const recipientSocketId = activeUsers.get(recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message", {
          sender: username,
          encryptedContent,
          timer,
          messageId,
        });
      } else {
        socket.emit("messageStatus", {
          messageId,
          status: "failed",
          reason: "Recipient offline",
        });
      }
    }
  );

  socket.on(
    "typing",
    ({ recipient, username }: { recipient: string; username: string }) => {
      const recipientSocketId = activeUsers.get(recipient);
      if (recipientSocketId)
        socket.to(recipientSocketId).emit("typing", { username });
    }
  );

  socket.on("messageRead", ({ messageId }: { messageId: string }) => {
    const sender = Array.from(activeUsers.entries()).find(
      ([_, id]) => id === socket.id
    )?.[0];
    const senderSocketId = activeUsers.get(sender || "");
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatus", {
        messageId,
        status: "read",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    const username = Array.from(activeUsers.entries()).find(
      ([_, id]) => id === socket.id
    )?.[0];
    if (username) activeUsers.delete(username);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
