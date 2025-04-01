import { io, Socket } from "socket.io-client";
import nacl from "tweetnacl";
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

  requestPublicKey(username: string) {
    this.socket.emit("requestPublicKey", { username });
  }

  getPublicKey(username: string) {
    return new Promise<Uint8Array>((resolve, reject) => {
      this.socket.once("publicKey", ({ publicKey }) => {
        if (publicKey) {
          resolve(decodeBase64(publicKey));
        } else {
          reject(new Error("Public key not found"));
        }
      });
      this.socket.emit("getPublicKey", { username });
    });
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

  register(username: string, publicKey: string) {
    this.socket.emit("register", { username, publicKey });
  }

  sendMessage(
    recipient: string,
    content: string,
    recipientPublicKey: Uint8Array,
    timer?: number,
  ) {
    if (!this.keyPair) return;
    if (recipientPublicKey.length !== nacl.box.publicKeyLength) {
      console.error(
        `Invalid public key length: ${recipientPublicKey.length}, expected ${nacl.box.publicKeyLength}`,
      );
      return;
    }
    const messageId = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
      new TextEncoder().encode(content),
      nonce,
      recipientPublicKey,
      this.keyPair.secretKey,
    );
    if (!encrypted) {
      console.error("Encryption failed");
      return;
    }
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
        this.socket.emit("messageRead", { messageId });
      },
    );
  }

  onMessageStatus(
    callback: (data: { messageId: string; status: "read" }) => void,
  ) {
    this.socket.on("messageStatus", callback);
  }

  onError(callback: (msg: string) => void) {
    this.socket.on("error", callback);
  }

  onTyping(callback: (username: string) => void) {
    this.socket.on("typing", ({ username }) => callback(username));
  }

  editMessage(
    recipient: string,
    messageId: string,
    content: string,
    recipientPublicKey: Uint8Array,
  ) {
    if (!this.keyPair) return;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
      new TextEncoder().encode(content),
      nonce,
      recipientPublicKey,
      this.keyPair.secretKey,
    );
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);
    this.socket.emit("editMessage", {
      recipient,
      messageId,
      encryptedContent: encodeBase64(fullMessage),
    });
  }

  deleteMessage(recipient: string, messageId: string) {
    this.socket.emit("deleteMessage", { recipient, messageId });
  }

  reactToMessage(recipient: string, messageId: string, reaction: string) {
    this.socket.emit("reactToMessage", { recipient, messageId, reaction });
  }

  onMessageEdited(
    callback: (data: { messageId: string; encryptedContent: string }) => void,
  ) {
    this.socket.on("messageEdited", callback);
  }

  onMessageDeleted(callback: (data: { messageId: string }) => void) {
    this.socket.on("messageDeleted", callback);
  }

  onMessageReaction(
    callback: (data: {
      messageId: string;
      sender: string;
      reaction: string;
    }) => void,
  ) {
    this.socket.on("messageReaction", callback);
  }

  getKeyPair() {
    return this.keyPair;
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const socketService = new SocketService(SERVER_URL);
