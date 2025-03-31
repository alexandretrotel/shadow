import { useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { MessageItem } from "./message-item";
import { Message } from "@/types/chat";
import { motion, AnimatePresence } from "motion/react";

interface MessageListProps {
  messages: Message[];
  username: string;
  typingUsers: string[];
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

export const MessageList = ({
  messages,
  username,
  typingUsers,
  onEdit,
  onDelete,
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
              <MessageItem
                message={msg}
                username={username}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground text-xs italic"
          >
            {typingUsers.join(", ")} typing...
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </CardContent>
  );
};
