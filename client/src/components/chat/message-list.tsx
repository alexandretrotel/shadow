import { useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { MessageItem } from "./message-item";
import { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  username: string;
  typingUsers: string[];
}

export const MessageList = ({
  messages,
  username,
  typingUsers,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <CardContent className="flex-grow flex flex-col p-0">
      <div className="flex-grow overflow-y-auto p-4 bg-muted">
        {messages.map((msg) => (
          <MessageItem key={msg.messageId} message={msg} username={username} />
        ))}
        {typingUsers.length > 0 && (
          <div className="text-xs text-muted-foreground italic">
            {typingUsers.join(", ")} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </CardContent>
  );
};
