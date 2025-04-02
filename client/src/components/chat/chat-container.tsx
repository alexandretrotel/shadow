import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { InputArea } from "./input-area";
import { MessageList } from "./message-list";
import { ChatHeader } from "./chat-header";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";

interface ChatRoomProps {
  recipient: string;
  messages: Message[];
  onSend: (content: string) => void;
  onLeave: () => void;
  isTyping: boolean;
  sendTyping: () => void;
  username: string;
}

export const ChatContainer = ({
  recipient,
  messages,
  onSend,
  onLeave,
  isTyping,
  sendTyping,
  username,
}: ChatRoomProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen w-screen flex-col overflow-hidden p-0"
    >
      <Card
        className={cn(
          "flex h-full flex-col gap-0 border-none py-0 shadow-lg",
          "bg-background",
        )}
      >
        <ChatHeader recipient={recipient} onLeave={onLeave} />
        <MessageList
          messages={messages}
          recipient={recipient}
          isTyping={isTyping}
          username={username}
        />
        <InputArea onSend={onSend} sendTyping={sendTyping} />
      </Card>
    </motion.div>
  );
};
