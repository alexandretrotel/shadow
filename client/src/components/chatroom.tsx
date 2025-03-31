import { memo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { PaperclipIcon, XIcon, DownloadIcon } from "lucide-react";

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

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

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
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input && !file) return;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const content = `[FILE:${file.name}]${encodeBase64(
        new Uint8Array(arrayBuffer)
      )}`;
      onSend(content);
      setFile(null);
    } else if (input) {
      onSend(input);
      setInput("");
    }
  };

  const isImageFile = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension && IMAGE_EXTENSIONS.includes(extension);
  };

  const renderMessage = (msg: Message) => {
    if (msg.content.startsWith("[FILE:")) {
      const [prefix, content] = msg.content.split("]");
      const fileName = prefix.slice(6);
      const fileData = decodeBase64(content);
      const base64Data = encodeBase64(fileData);
      const dataUrl = `data:application/octet-stream;base64,${base64Data}`;

      if (isImageFile(fileName)) {
        return (
          <div className="flex flex-col gap-1">
            <img
              src={`data:image/${fileName
                .split(".")
                .pop()};base64,${base64Data}`}
              alt={fileName}
              className="max-w-[300px] rounded-md"
            />
            <a
              href={dataUrl}
              download={fileName}
              className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1"
            >
              <DownloadIcon className="size-3" /> Download {fileName}
            </a>
          </div>
        );
      }

      return (
        <a
          href={dataUrl}
          download={fileName}
          className="text-accent-foreground underline hover:text-accent flex items-center gap-1"
        >
          📎 {fileName}
        </a>
      );
    }

    return <span className="text-foreground">{msg.content}</span>;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto  shadow-lg border-none gap-0 py-0 flex flex-col h-[85vh]">
      <CardHeader className="flex-shrink-0 border-b border-muted pt-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-secondary-foreground tracking-wide">
            Room: {roomName}
          </CardTitle>
          <Button
            onClick={onLeave}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-accent-foreground"
          >
            Leave
          </Button>
        </div>
        {participants.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
            {participants.map((p) => (
              <span key={p.username} className="bg-muted px-2 py-1 rounded">
                {p.username} ({getKeyFingerprint(p.publicKey)})
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <div className="flex-grow overflow-y-auto p-4 bg-muted">
          {messages.map((msg) => (
            <div
              key={msg.messageId}
              className={`mb-3 text-sm flex flex-col ${
                msg.sender === username ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-2 rounded-lg ${
                  msg.sender === username
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-card text-foreground"
                }`}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {msg.sender === username ? "You" : msg.sender}:
                </span>{" "}
                {renderMessage(msg)}
                {msg.timer && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({msg.timer}s)
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {msg.status}
              </span>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="text-xs text-muted-foreground italic">
              {typingUsers.join(", ")} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={handleSend}
          className="flex-shrink-0 p-4 border-t border-muted flex flex-col gap-2"
        >
          {file && (
            <div className="flex items-center gap-2 bg-muted p-2 rounded">
              <span className="text-sm text-foreground truncate">
                📎 {file.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="p-1"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-accent-foreground"
            >
              <PaperclipIcon className="size-5" />
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Input
              placeholder="Whisper in the dark..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                sendTyping();
              }}
              className="flex-grow bg-muted text-foreground placeholder-muted-foreground border-none focus:ring-accent"
            />
            <Button
              type="submit"
              className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
