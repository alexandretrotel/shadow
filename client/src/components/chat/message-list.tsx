import { useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { MessageItem } from "./message-item";
import { motion, AnimatePresence } from "motion/react";
import { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  recipient: string;
  isTyping: boolean;
  username: string;
}

export const MessageList = ({
  messages,
  recipient,
  isTyping,
  username,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <CardContent className="bg-muted flex flex-grow flex-col overflow-y-auto p-4">
      <AnimatePresence>
        {messages?.map((msg) => {
          if (!msg) return null;

          const isOwnMessage = msg.sender === username;

          return (
            <motion.div
              key={msg.messageId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <MessageItem message={msg} isOwnMessage={isOwnMessage} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {isTyping && (
          <motion.div
            key="typing-indicator"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-muted-foreground animate-pulse text-xs italic"
          >
            {recipient} typing...
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </CardContent>
  );
};
