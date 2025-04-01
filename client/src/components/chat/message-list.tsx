import { useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { MessageItem } from "./message-item";
import { motion, AnimatePresence } from "motion/react";

interface MessageListProps {
  messages: Message[];
  username: string;
  isTyping: boolean;
}

export const MessageList = ({
  messages,
  username,
  isTyping,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <CardContent className="flex flex-grow flex-col p-0">
      <div className="bg-muted flex-grow overflow-y-auto p-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.messageId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <MessageItem message={msg} username={username} />
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground text-xs italic"
          >
            {username} typing...
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </CardContent>
  );
};
