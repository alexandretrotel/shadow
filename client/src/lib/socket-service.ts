import { io, Socket } from "socket.io-client";
import nacl from "tweetnacl";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { Message, Participant } from "@/types/chat";
import { SERVER_URL } from "./server";

export class SocketService {
  private socket: Socket;
  private keyPair: nacl.BoxKeyPair | null = null;
  private seenMessageIds = new Set<string>();

  constructor(url: string) {
    this.socket = io(url, { autoConnect: false });
    this.restoreKeyPair();
    this.socket.connect();
  }

  private restoreKeyPair() {
    const storedKeyPair = localStorage.getItem("chatKeyPair");
    if (storedKeyPair) {
      const { publicKey, secretKey } = JSON.parse(storedKeyPair);
      this.keyPair = {
        publicKey: decodeBase64(publicKey),
        secretKey: decodeBase64(secretKey),
      };
    }
  }

  setKeyPair(keyPair: nacl.BoxKeyPair | null) {
    this.keyPair = keyPair;
    if (keyPair) {
      localStorage.setItem(
        "chatKeyPair",
        JSON.stringify({
          publicKey: encodeBase64(keyPair.publicKey),
          secretKey: encodeBase64(keyPair.secretKey),
        }),
      );
    } else {
      localStorage.removeItem("chatKeyPair");
    }
  }

  getSocket() {
    return this.socket;
  }

  onConnect(callback: () => void) {
    this.socket.on("connect", callback);
  }

  onDisconnect(callback: () => void) {
    this.socket.on("disconnect", callback);
  }

  joinRoom(
    roomName: string,
    password: string,
    username: string,
    publicKey: string,
  ) {
    this.socket.emit("joinRoom", { roomName, password, username, publicKey });
  }

  sendMessage(
    roomName: string,
    content: string,
    participants: Participant[],
    timer?: number,
  ) {
    if (!this.keyPair) return;
    const messageId = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    participants.forEach((p) => {
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const encrypted = nacl.box(
        new TextEncoder().encode(content),
        nonce,
        p.publicKey,
        this.keyPair!.secretKey,
      );
      const fullMessage = new Uint8Array(nonce.length + encrypted.length);
      fullMessage.set(nonce);
      fullMessage.set(encrypted, nonce.length);
      this.socket.emit("message", {
        roomName,
        encryptedContent: encodeBase64(fullMessage),
        timer,
        messageId,
      });
    });
    return messageId;
  }

  leaveRoom(roomName: string) {
    this.socket.emit("leaveRoom", { roomName });
  }

  sendTyping(roomName: string, username: string) {
    this.socket.emit("typing", { roomName, username });
  }

  onPublicKeys(
    callback: (data: { username: string; publicKey: string }) => void,
  ) {
    this.socket.on("publicKeys", callback);
  }

  onMessage(callback: (msg: Message) => void) {
    this.socket.on(
      "message",
      ({ sender, encryptedContent, timer, messageId }) => {
        if (this.seenMessageIds.has(messageId)) return;
        this.seenMessageIds.add(messageId);

        callback({
          sender,
          content: encryptedContent,
          timer,
          messageId,
          status: "sent",
        });
      },
    );
  }

  onError(callback: (msg: string) => void) {
    this.socket.on("error", callback);
  }

  onTyping(callback: (username: string) => void) {
    this.socket.on("typing", ({ username }) => callback(username));
  }

  getKeyPair() {
    return this.keyPair;
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const socketService = new SocketService(SERVER_URL);
