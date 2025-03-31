import { JoinRoom } from "@/components/join-room";
import { ChatContainer } from "@/components/chat/chat-container";
import { useChat } from "@/hooks/use-chat";
import { useChatState } from "@/hooks/use-chat";
import { motion } from "motion/react";

function App() {
  const { roomName, username, messages, participants, typingUsers } =
    useChatState();
  const {
    joinRoom,
    sendMessage,
    leaveRoom,
    getKeyFingerprint,
    sendTyping,
    editMessage,
    deleteMessage,
    reactToMessage,
  } = useChat();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="md:bg-background bg-card flex min-h-screen flex-col items-center justify-center gap-4 md:p-4"
    >
      {!roomName ? (
        <JoinRoom onJoin={joinRoom} />
      ) : (
        <ChatContainer
          roomName={roomName}
          username={username}
          messages={messages}
          participants={participants}
          onSend={sendMessage}
          onLeave={leaveRoom}
          getKeyFingerprint={getKeyFingerprint}
          typingUsers={typingUsers}
          sendTyping={sendTyping}
          editMessage={editMessage}
          deleteMessage={deleteMessage}
          reactToMessage={reactToMessage}
        />
      )}
    </motion.div>
  );
}

export default App;
