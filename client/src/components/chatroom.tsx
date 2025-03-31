import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  sender: string;
  content: string;
  timer?: number;
}

interface ChatRoomProps {
  roomName: string;
  username: string;
  messages: Message[];
  onSend: (content: string, timer?: number) => void;
}

export function ChatRoom({
  roomName,
  username,
  messages,
  onSend,
}: ChatRoomProps) {
  const [message, setMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-10 shadow-lg border-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg text-secondary-foreground tracking-wide">
          Room: {roomName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-96 overflow-y-auto mb-4 p-4 bg-muted rounded-md">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-2 text-sm">
              <span className="text-accent-foreground font-mono">
                {msg.sender === username ? "You" : msg.sender}:
              </span>{" "}
              <span className="text-foreground">{msg.content}</span>
              {msg.timer && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Vanishes in {msg.timer}s)
                </span>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex space-x-2">
          <Input
            placeholder="Whisper in the dark..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-muted text-foreground placeholder-muted-foreground border-none focus:ring-accent"
          />
          <Button
            type="submit"
            className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
