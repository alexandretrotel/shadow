import { ChatRoomProps } from "@/types/chat";
import { MessageSearch } from "./message-search";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { InputArea } from "./input-area";
import { MessageList } from "./message-list";
import { Participants } from "./participants";

export const ChatContainer = ({
  roomName,
  username,
  messages,
  participants,
  onSend,
  onLeave,
  getKeyFingerprint,
  typingUsers,
  sendTyping,
  editMessage,
  deleteMessage,
}: ChatRoomProps & {
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
}) => {
  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="mx-auto flex h-[85vh] w-full max-w-3xl flex-col gap-0 border-none py-0 shadow-lg">
        <Participants
          roomName={roomName}
          participants={participants}
          onLeave={onLeave}
          getKeyFingerprint={getKeyFingerprint}
        />
        <MessageSearch messages={messages} onSelect={scrollToMessage} />
        <MessageList
          messages={messages}
          username={username}
          typingUsers={typingUsers}
          onEdit={editMessage}
          onDelete={deleteMessage}
        />
        <InputArea onSend={onSend} sendTyping={sendTyping} />
      </Card>
    </motion.div>
  );
};
