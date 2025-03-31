import { useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { MessageItem } from "./message-item";
import { Message } from "@/types/chat";
import { motion } from "motion/react";

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
    <CardContent className="flex flex-grow flex-col p-0">
      <div className="bg-muted flex-grow overflow-y-auto p-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.messageId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <MessageItem
              key={msg.messageId}
              message={msg}
              username={username}
            />
          </motion.div>
        ))}
        {typingUsers.length > 0 && (
          <div className="text-muted-foreground text-xs italic">
            {typingUsers.join(", ")} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </CardContent>
  );
};
