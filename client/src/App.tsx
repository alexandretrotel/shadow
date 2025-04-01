import { useChat } from "@/hooks/use-chat";
import { useChatState } from "@/hooks/use-chat";
import { motion } from "motion/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Home } from "./components/home";
import { ChatRoom } from "./components/chatroom";

function App() {
  const { username, currentRecipient, messages, typingUsers } = useChatState();
  const { sendMessage, leaveChat, sendTyping } = useChat();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card flex min-h-screen flex-col items-center justify-center gap-4"
      >
        {!username || !currentRecipient ? (
          <Home />
        ) : (
          <ChatRoom
            username={username}
            recipient={currentRecipient}
            messages={messages}
            onSend={sendMessage}
            onLeave={leaveChat}
            typingUsers={typingUsers}
            sendTyping={sendTyping}
          />
        )}
      </motion.div>
    </ThemeProvider>
  );
}

export default App;
