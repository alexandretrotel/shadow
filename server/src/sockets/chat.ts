import { Server, Socket } from "socket.io";
import { throttle } from "lodash";
import {
  messageSchema,
  typingSchema,
  userSchema,
} from "../../../shared/src/schemas";
import { db } from "../../../shared/db";
import { users } from "../../../shared/db/schema";
import { eq } from "drizzle-orm";

const activeUsers = new Map<string, string>();

export function setupSockets(io: Server) {
  io.use((socket: Socket, next) => {
    const username = socket.handshake.auth.username;
    if (!userSchema.shape.username.safeParse(username).success)
      return next(new Error("Invalid username"));
    next();
  });

  io.on("connection", (socket) => {
    const username = socket.handshake.auth.username;
    activeUsers.set(username, socket.id);

    socket.on("message", async (data) => {
      const parsed = messageSchema.safeParse(data);
      if (!parsed.success)
        return socket.emit("error", "Invalid message format");

      const { recipient, encryptedContent, timer, messageId } = parsed.data;
      const recipientUser = await db
        .select()
        .from(users)
        .where(eq(users.username, recipient))
        .limit(1);
      if (recipientUser.length === 0)
        return socket.emit("error", `User ${recipient} not found`);

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
    });

    socket.on(
      "typing",
      throttle((data) => {
        const parsed = typingSchema.safeParse(data);
        if (!parsed.success) return socket.emit("error", "Invalid typing data");
        const { recipient, username } = parsed.data;
        const recipientSocketId = activeUsers.get(recipient);
        if (recipientSocketId)
          socket.to(recipientSocketId).emit("typing", { username });
      }, 1000)
    );

    socket.on("messageRead", ({ messageId }: { messageId: string }) => {
      const sender = Array.from(activeUsers.entries()).find(
        ([_, id]) => id === socket.id
      )?.[0];
      const senderSocketId = activeUsers.get(sender || "");
      if (senderSocketId)
        io.to(senderSocketId).emit("messageStatus", {
          messageId,
          status: "read",
        });
    });

    socket.on("disconnect", () => {
      const username = Array.from(activeUsers.entries()).find(
        ([_, id]) => id === socket.id
      )?.[0];
      if (username) activeUsers.delete(username);
    });
  });
}
