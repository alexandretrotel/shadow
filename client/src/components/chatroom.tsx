import { memo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";

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

interface ChatRoomProps {
  roomName: string;
  username: string;
  messages: Message[];
  participants: Participant[];
  onSend: (content: string, timer?: number) => void;
  onLeave: () => void;
  getKeyFingerprint: (key: Uint8Array) => string;
  typingUsers: string[];
  sendTyping: () => void;
}

export const ChatRoom = memo(function ChatRoom({
  roomName,
  username,
  messages,
  participants,
  onSend,
  onLeave,
  getKeyFingerprint,
  typingUsers,
  sendTyping,
}: ChatRoomProps) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      onSend(message);
      setMessage("");
    }
  };

  const handleFileSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const content = `[FILE:${file.name}]${encodeBase64(
        new Uint8Array(arrayBuffer)
      )}`;
      onSend(content);
      setFile(null);
    }
  };

  const renderMessage = (msg: Message) => {
    if (msg.content.startsWith("[FILE:")) {
      const [prefix, content] = msg.content.split("]");
      const fileName = prefix.slice(6);
      const fileData = decodeBase64(content);
      return (
        <div>
          <a
            href={`data:application/octet-stream;base64,${encodeBase64(
              fileData
            )}`}
            download={fileName}
            className="text-accent-foreground underline"
          >
            Download {fileName}
          </a>
        </div>
      );
    }
    return <span className="text-foreground">{msg.content}</span>;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-10 shadow-lg border-none">
      <CardHeader>
        <CardTitle className="text-lg text-secondary-foreground tracking-wide">
          Room: {roomName}
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          In room:{" "}
          {participants
            .map((p) => `${p.username} (${getKeyFingerprint(p.publicKey)})`)
            .join(", ")}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 overflow-y-auto mb-4 p-4 bg-muted rounded-md">
          {messages.map((msg) => (
            <div key={msg.messageId} className="mb-2 text-sm flex items-center">
              <span className="text-accent-foreground font-mono">
                {msg.sender === username ? "You" : msg.sender}:
              </span>{" "}
              {renderMessage(msg)}
              {msg.timer && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Vanishes in {msg.timer}s)
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-2">
                {msg.status}
              </span>
            </div>
          ))}

          {typingUsers.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {typingUsers.join(", ")} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex space-x-2">
          <Input
            placeholder="Whisper in the dark..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              sendTyping();
            }}
            className="bg-muted text-foreground placeholder-muted-foreground border-none focus:ring-accent"
          />
          <Button
            type="submit"
            className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Send
          </Button>
        </form>
        <form onSubmit={handleFileSend} className="flex space-x-2 mt-2">
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="bg-muted text-foreground border-none"
          />
          <Button
            type="submit"
            className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Send File
          </Button>
        </form>
        <Button onClick={onLeave} variant="outline" className="mt-2 w-full">
          Leave Room
        </Button>
      </CardContent>
    </Card>
  );
});
