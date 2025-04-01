import { io, Socket } from "socket.io-client";
import { SERVER_URL } from "./server";
import { Message } from "@/types/chat";

export class SocketService {
  private socket: Socket;

  constructor(url: string) {
    this.socket = io(url, { autoConnect: false });
  }

  connect(username: string) {
    this.socket.auth = { username };
    this.socket.connect();
  }

  sendMessage(
    recipient: string,
    encryptedContent: string,
    timer?: number,
    messageId?: string,
  ) {
    const id =
      messageId || `${Date.now()}${Math.random().toString(36).slice(2)}`;
    this.socket.emit("message", {
      recipient,
      encryptedContent,
      timer,
      messageId: id,
    });
    return id;
  }

  async checkUsername(username: string) {
    const response = await fetch(`${SERVER_URL}/username/${username}`);
    return response.json();
  }

  async getPublicKey(username: string) {
    const response = await fetch(`${SERVER_URL}/public-key/${username}`);
    if (!response.ok) throw new Error("User not found");
    return response.json();
  }

  sendTyping(recipient: string, username: string) {
    this.socket.emit("typing", { recipient, username });
  }

  onMessage(callback: (msg: Message) => void) {
    this.socket.on("message", callback);
  }

  onMessageStatus(
    callback: (data: {
      messageId: string;
      status: string;
      reason?: string;
    }) => void,
  ) {
    this.socket.on("messageStatus", callback);
  }

  onTyping(callback: (username: string) => void) {
    this.socket.on("typing", ({ username }) => callback(username));
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const socketService = new SocketService(SERVER_URL);
