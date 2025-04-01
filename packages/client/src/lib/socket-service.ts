import { io, Socket } from "socket.io-client";
import nacl, { box, randomBytes } from "tweetnacl";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { Message } from "@/types/chat";
import { SERVER_URL } from "./server";

export class SocketService {
  private socket: Socket;
  private keyPair: nacl.BoxKeyPair | null = null;
  private seenMessageIds = new Set<string>();

  constructor(url: string) {
    this.socket = io(url, { autoConnect: false });
    this.restoreKeyPair();
  }

  connect(username: string) {
    this.socket.auth = { username };
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

  async register(username: string, publicKey: string) {
    const response = await fetch(`${SERVER_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, publicKey }),
    });
    return response.json();
  }

  async setKeyPairWithPassword(keyPair: nacl.BoxKeyPair, password: string) {
    const nonce = randomBytes(box.nonceLength);
    const encryptedSecretKey = box(
      keyPair.secretKey,
      nonce,
      nacl.hash(new TextEncoder().encode(password)).slice(0, 32),
      keyPair.secretKey,
    );

    localStorage.setItem(
      "chatKeyPair",
      JSON.stringify({
        publicKey: encodeBase64(keyPair.publicKey),
        encryptedSecretKey: encodeBase64(encryptedSecretKey),
        nonce: encodeBase64(nonce),
      }),
    );
    this.keyPair = keyPair;
  }

  restoreKeyPairWithPassword(password: string) {
    const storedKeyPair = localStorage.getItem("chatKeyPair");
    if (!storedKeyPair) return false;

    const { publicKey, encryptedSecretKey, nonce } = JSON.parse(storedKeyPair);
    const decrypted = box.open(
      decodeBase64(encryptedSecretKey),
      decodeBase64(nonce),
      nacl.hash(new TextEncoder().encode(password)).slice(0, 32),
      decodeBase64(publicKey),
    );

    if (!decrypted) return false;

    this.keyPair = {
      publicKey: decodeBase64(publicKey),
      secretKey: decrypted,
    };
    return true;
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

  setKeyPair(keyPair: nacl.BoxKeyPair | null, password?: string) {
    if (!keyPair) {
      this.keyPair = null;
      localStorage.removeItem("chatKeyPair");
      return;
    }
    if (password) {
      this.setKeyPairWithPassword(keyPair, password);
    } else {
      localStorage.setItem(
        "chatKeyPair",
        JSON.stringify({
          publicKey: encodeBase64(keyPair.publicKey),
          secretKey: encodeBase64(keyPair.secretKey),
        }),
      );
      this.keyPair = keyPair;
    }
  }

  getSocket() {
    return this.socket;
  }

  sendMessage(
    recipient: string,
    content: string,
    recipientPublicKey: Uint8Array,
    timer?: number,
  ) {
    if (!this.keyPair) return;
    const messageId = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
      new TextEncoder().encode(content),
      nonce,
      recipientPublicKey,
      this.keyPair.secretKey,
    );
    if (!encrypted) return;
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);
    this.socket.emit("message", {
      recipient,
      encryptedContent: encodeBase64(fullMessage),
      timer,
      messageId,
    });
    return messageId;
  }

  sendTyping(recipient: string, username: string) {
    this.socket.emit("typing", { recipient, username });
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
        this.socket.emit("messageRead", { messageId });
      },
    );
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

  getKeyPair() {
    return this.keyPair;
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const socketService = new SocketService(SERVER_URL);
