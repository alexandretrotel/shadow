import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import nacl from "tweetnacl";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { JoinRoom } from "./components/join-room";
import { ChatRoom } from "./components/chatroom";

interface Message {
  sender: string;
  content: string;
  timer?: number;
}

interface Participant {
  username: string;
  publicKey: Uint8Array;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [keyPair, setKeyPair] = useState<nacl.BoxKeyPair | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("publicKeys", ({ username: sender, publicKey }) => {
      const pubKey = decodeBase64(publicKey);
      setParticipants((prev) => [
        ...prev,
        { username: sender, publicKey: pubKey },
      ]);
    });

    socket.on("message", ({ sender, encryptedContent, timer }) => {
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
          setMessages((prev) => [...prev, { sender, content, timer }]);
          if (timer) {
            setTimeout(() => {
              setMessages((prev) => prev.filter((m) => m.content !== content));
            }, timer * 1000);
          }
        }
      }
    });

    socket.on("error", (msg) => alert(msg));

    return () => {
      socket.off("publicKeys");
      socket.off("message");
      socket.off("error");
    };
  }, [socket, keyPair, participants]);

  const handleJoin = (room: string, password: string, user: string) => {
    const keys = nacl.box.keyPair();
    setKeyPair(keys);
    setRoomName(room);
    setUsername(user);
    socket?.emit("joinRoom", {
      roomName: room,
      password,
      username: user,
      publicKey: encodeBase64(keys.publicKey),
    });
  };

  const handleSend = (content: string, timer?: number) => {
    if (!socket || !keyPair) return;
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
      });
    });
    setMessages((prev) => [...prev, { sender: username, content, timer }]);
    if (timer) {
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.content !== content));
      }, timer * 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {!roomName ? (
        <JoinRoom onJoin={handleJoin} />
      ) : (
        <ChatRoom
          roomName={roomName}
          username={username}
          messages={messages}
          onSend={handleSend}
        />
      )}
    </div>
  );
}

export default App;
