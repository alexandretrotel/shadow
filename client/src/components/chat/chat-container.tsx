import { ChatRoomProps } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { MessageList } from "./message-list";
import { InputArea } from "./input-area";
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
}: ChatRoomProps) => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg border-none gap-0 py-0 flex flex-col h-[85vh]">
    <Participants
      roomName={roomName}
      participants={participants}
      onLeave={onLeave}
      getKeyFingerprint={getKeyFingerprint}
    />
    <MessageList
      messages={messages}
      username={username}
      typingUsers={typingUsers}
    />
    <InputArea onSend={onSend} sendTyping={sendTyping} />
  </Card>
);
