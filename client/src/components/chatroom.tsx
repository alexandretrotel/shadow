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
  status?: "sent" | "delivered" | "failed" | "read";
  messageId: string;
}

interface ChatRoomProps {
  username: string;
  recipient: string;
  messages: Message[];
  onSend: (content: string, timer?: number) => void;
  onLeave: () => void;
  typingUsers: string[];
  sendTyping: () => void;
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export const ChatRoom = memo(function ChatRoom({
  username,
  recipient,
  messages,
  onSend,
  onLeave,
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
      const content = `[FILE:${file.name}]${encodeBase64(new Uint8Array(arrayBuffer))}`;
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
              src={`data:image/${fileName.split(".").pop()};base64,${base64Data}`}
              alt={fileName}
              className="max-w-[300px] rounded-md"
            />
            <a
              href={dataUrl}
              download={fileName}
              className="text-muted-foreground flex items-center gap-1 text-xs"
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
          className="text-accent-foreground flex items-center gap-1 underline"
        >
          📎 {fileName}
        </a>
      );
    }

    return <span className="text-foreground">{msg.content}</span>;
  };

  return (
    <Card className="mx-auto flex h-screen w-full flex-col gap-0 border-none py-0 shadow-lg">
      <CardHeader className="border-muted flex-shrink-0 border-b pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-secondary-foreground text-lg tracking-wide">
              Chat with {recipient}
            </CardTitle>
            <div className="text-muted-foreground bg-muted hover:bg-muted/80 rounded px-2 py-1 text-xs">
              pubkey
            </div>
          </div>
          <Button
            onClick={onLeave}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            Exit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col p-0">
        <div className="bg-muted flex-grow overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.messageId}
              className={`mb-3 flex flex-col text-sm ${
                msg.sender === username ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-2 ${
                  msg.sender === username
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-card text-foreground"
                }`}
              >
                <span className="text-muted-foreground font-mono text-xs">
                  {msg.sender === username ? "You" : msg.sender}:
                </span>{" "}
                {renderMessage(msg)}
                {msg.timer && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({msg.timer}s)
                  </span>
                )}
              </div>
              <span className="text-muted-foreground mt-1 text-xs">
                {msg.status}
              </span>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="text-muted-foreground text-xs italic">
              {typingUsers.join(", ")} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={handleSend}
          className="border-muted flex flex-shrink-0 flex-col gap-2 border-t p-4"
        >
          {file && (
            <div className="bg-muted flex items-center gap-2 rounded p-2">
              <span className="text-foreground truncate text-sm">
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
              className="text-muted-foreground"
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
              className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent flex-grow border-none"
            />
            <Button
              type="submit"
              className="bg-secondary text-secondary-foreground"
            >
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
