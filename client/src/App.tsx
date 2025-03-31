import { JoinRoom } from "@/components/join-room";
import { ChatContainer } from "@/components/chat/chat-container";
import { useChat } from "@/hooks/use-chat";

function App() {
  const {
    roomName,
    username,
    messages,
    participants,
    joinRoom,
    sendMessage,
    leaveRoom,
    getKeyFingerprint,
    typingUsers,
    sendTyping,
  } = useChat();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
        />
      )}
    </div>
  );
}

export default App;
