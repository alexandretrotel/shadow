import { ChatRoom } from "@/components/chatroom";
import { useChatState, useChat } from "@/hooks/use-chat";
import { useNavigate } from "react-router-dom";

export const ChatRoomWrapper = () => {
  const { username, messages, currentRecipient, typingUsers } = useChatState();
  const { sendMessage, leaveChat, sendTyping } = useChat();
  const navigate = useNavigate();

  if (!currentRecipient) return null;

  return (
    <ChatRoom
      username={username}
      recipient={currentRecipient}
      messages={messages}
      onSend={sendMessage}
      onLeave={() => {
        leaveChat();
        navigate("/");
      }}
      typingUsers={typingUsers}
      sendTyping={sendTyping}
    />
  );
};
