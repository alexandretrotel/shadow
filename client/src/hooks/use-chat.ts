import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import nacl from "tweetnacl";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import debounce from "lodash/debounce";

interface Message {
  sender: string;
  content: string;
  timer?: number;
  status?: "sent" | "delivered" | "failed";
  messageId: string;
}

interface Participant {
  username: string;
  publicKey: Uint8Array;
}

export function useChat() {
  const [socket] = useState(io("http://localhost:3000"));
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [keyPair, setKeyPair] = useState<nacl.BoxKeyPair | null>(null);
  const [seenMessageIds] = useState(new Set<string>());
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !keyPair) return;

    socket.on("publicKeys", ({ username: sender, publicKey }) => {
      const pubKey = decodeBase64(publicKey);
      setParticipants((prev) => {
        if (!prev.some((p) => p.username === sender)) {
          return [...prev, { username: sender, publicKey: pubKey }];
        }
        return prev;
      });
    });

    socket.on("message", ({ sender, encryptedContent, timer, messageId }) => {
      if (seenMessageIds.has(messageId)) return;
      seenMessageIds.add(messageId);

      const encrypted = decodeBase64(encryptedContent);
      const nonce = encrypted.slice(0, nacl.box.nonceLength);
      const ciphertext = encrypted.slice(nacl.box.nonceLength);
      const senderPubKey = participants.find(
        (p) => p.username === sender
      )?.publicKey;

      if (senderPubKey && keyPair) {
        const decrypted = nacl.box.open(
          ciphertext,
          nonce,
          senderPubKey,
          keyPair.secretKey
        );
        if (decrypted) {
          const content = new TextDecoder().decode(decrypted);
          setMessages((prev) => [
            ...prev,
            { sender, content, timer, status: "delivered", messageId },
          ]);
          if (timer) {
            setTimeout(() => {
              setMessages((prev) =>
                prev.filter((m) => m.messageId !== messageId)
              );
            }, timer * 1000);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender,
              content: "Decryption failed",
              status: "failed",
              messageId,
            },
          ]);
        }
      }
    });

    socket.on("error", (msg) => alert(msg));

    socket.on("typing", ({ username: typer }) => {
      setTypingUsers((prev) => [...new Set([...prev, typer])]);
      setTimeout(
        () => setTypingUsers((prev) => prev.filter((u) => u !== typer)),
        2000
      );
    });

    return () => {
      socket.off("publicKeys");
      socket.off("message");
      socket.off("error");
      socket.off("typing");
    };
  }, [socket, keyPair, participants, seenMessageIds]);

  const joinRoom = (room: string, password: string, user: string) => {
    const keys = nacl.box.keyPair();
    setKeyPair(keys);
    setRoomName(room);
    setUsername(user);
    socket.emit("joinRoom", {
      roomName: room,
      password,
      username: user,
      publicKey: encodeBase64(keys.publicKey),
    });
  };

  const sendMessage = (content: string, timer?: number) => {
    if (!socket || !keyPair) return;
    const messageId =
      Date.now().toString() + Math.random().toString(36).slice(2);
    participants.forEach((p) => {
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const encrypted = nacl.box(
        new TextEncoder().encode(content),
        nonce,
        p.publicKey,
        keyPair.secretKey
      );
      const fullMessage = new Uint8Array(nonce.length + encrypted.length);
      fullMessage.set(nonce);
      fullMessage.set(encrypted, nonce.length);
      socket.emit("message", {
        roomName,
        encryptedContent: encodeBase64(fullMessage),
        timer,
        messageId,
      });
    });
    setMessages((prev) => [
      ...prev,
      { sender: username, content, timer, status: "sent", messageId },
    ]);
    if (timer) {
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
      }, timer * 1000);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", { roomName });
    setRoomName("");
    setMessages([]);
    setParticipants([]);
    setKeyPair(null);
  };

  const getKeyFingerprint = (key: Uint8Array) => {
    const hash = nacl.hash(key);
    return encodeBase64(hash.slice(0, 8));
  };

  const sendTyping = debounce(() => {
    socket.emit("typing", { roomName, username });
  }, 500);

  return {
    socket,
    roomName,
    username,
    messages,
    participants,
    joinRoom,
    sendMessage,
    leaveRoom,
    getKeyFingerprint,
    typingUsers,
    sendTyping,
  };
}
