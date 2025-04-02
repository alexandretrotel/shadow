import { useEffect, useMemo, useState } from "react";
import { ChatContainer } from "@/components/chat/chat-container";
import { Message } from "@/lib/types";
import { useSocket } from "@/store/socket.store";
import { toast } from "sonner";
import { useChat } from "@/store/chat.store";
import { redirect, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/store/auth.store";
import { debounce } from "lodash";

export const Chat = () => {
  const { recipient } = useParams<{ recipient: string }>();

  const [isTyping, setIsTyping] = useState(false);

  const { socket, closeSocket } = useSocket();
  const { username } = useAuth();
  const { messages, addMessage } = useChat();
  const navigate = useNavigate();

  const debouncedSendMessage = useMemo(
    () =>
      debounce((content: string) => {
        if (!socket || !username || !recipient) {
          toast.error("Connection or authentication issue");
          redirect("/");
          return;
        }

        const message: Message = {
          sender: username,
          content,
          messageId: crypto.randomUUID(),
          status: "sent",
        };

        socket.emit("message", { username, message });
        addMessage(recipient, message);
      }, 300),
    [socket, username, recipient, addMessage],
  );

  const debouncedHandleTyping = useMemo(
    () =>
      debounce(() => {
        if (!socket || !username || !recipient) {
          toast.error("Connection or authentication issue");
          return;
        }
        socket.emit("typing", { recipient, username });
      }, 500),
    [socket, username, recipient],
  );

  useEffect(() => {
    if (!socket || !recipient || !username) {
      if (!socket) toast.error("Not connected to the server");
      if (!recipient) toast.error("Recipient not found");
      if (!username) toast.error("You are not authenticated");
      return;
    }

    // Function to attach event listeners
    const attachListeners = () => {
      socket
        .off("message")
        .on("message", (msg: Message) => addMessage(recipient, msg));
      socket.off("typing").on("typing", () => setIsTyping(true));
      socket.off("stopTyping").on("stopTyping", () => {
        setIsTyping(false);
      });
    };

    // Initial attachment
    attachListeners();

    // Reattach listeners on reconnect
    socket.on("reconnect", () => {
      attachListeners();
    });

    return () => {
      socket.off("message");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("reconnect");
      debouncedSendMessage.cancel();
      debouncedHandleTyping.cancel();
    };
  }, [
    socket,
    addMessage,
    closeSocket,
    recipient,
    username,
    debouncedSendMessage,
    debouncedHandleTyping,
  ]);

  const handleSendMessage = (content: string) => {
    debouncedSendMessage(content);
  };

  const handleTyping = () => {
    debouncedHandleTyping();
  };

  if (!recipient || !username) {
    toast.error("Authentication or recipient issue");
    redirect("/");
    return null;
  }

  return (
    <ChatContainer
      recipient={recipient}
      messages={messages[recipient]}
      onSend={handleSendMessage}
      onLeave={() => navigate("/")}
      isTyping={isTyping}
      sendTyping={handleTyping}
      username={username}
    />
  );
};
