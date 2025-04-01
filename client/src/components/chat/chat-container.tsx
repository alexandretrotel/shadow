import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { InputArea } from "./input-area";
import { MessageList } from "./message-list";
import { ChatHeader } from "./chat-header";
import { cn } from "@/lib/utils";
import { Message } from "../../../../shared/src/types";

interface ChatRoomProps {
  username: string;
  messages: Message[];
  onSend: (content: string) => void;
  onLeave: () => void;
  isTyping: boolean;
  sendTyping: () => void;
}

export const ChatContainer = ({
  username,
  messages,
  onSend,
  onLeave,
  isTyping,
  sendTyping,
}: ChatRoomProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen w-screen flex-col p-0"
    >
      <Card
        className={cn(
          "flex h-full flex-col gap-0 border-none py-0 shadow-lg",
          "bg-background",
        )}
      >
        <ChatHeader username={username} onLeave={onLeave} />
        <MessageList
          messages={messages}
          username={username}
          isTyping={isTyping}
        />
        <InputArea onSend={onSend} sendTyping={sendTyping} />
      </Card>
    </motion.div>
  );
};
