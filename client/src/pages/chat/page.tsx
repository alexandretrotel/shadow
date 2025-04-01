import { useEffect, useState } from "react";
import { ChatContainer } from "@/components/chat/chat-container";
import { Message } from "../../../../common/src/types";
import { initializeSocket, useSocket } from "@/store/socket.store";
import { toast } from "sonner";
import { useChat } from "@/store/chat.store";
import { redirect, useParams } from "react-router-dom";
import { useAuth } from "@/store/auth.store";

export const Chat = () => {
  const { recipient } = useParams<{ recipient: string }>();

  const [isTyping, setIsTyping] = useState(false);

  initializeSocket();
  const { socket, closeSocket } = useSocket();
  const { username } = useAuth();
  const { messages, addMessage, clearMessages } = useChat();

  useEffect(() => {
    if (!socket) {
      toast.error("You are not connected to the server");
      return;
    }

    if (!recipient) {
      toast.error("Recipient not found");
      return;
    }

    socket.emit("join", recipient);
    socket.on("message", (msg: Message) => addMessage(recipient, msg));
    socket.on("typing", () => setIsTyping(true));

    return () => {
      closeSocket();
    };
  }, [socket, addMessage, closeSocket, recipient]);

  const sendMessage = (content: string) => {
    if (!socket) {
      toast.error("You are not connected to the server");
      return;
    }

    if (!recipient) {
      toast.error("Recipient not found");
      return;
    }

    const message: Message = {
      sender: recipient,
      content,
      messageId: Date.now().toString(),
      status: "sent",
    };

    socket.emit("message", { recipient: "recipientUsername", message });

    addMessage(recipient, message);
  };

  const handleTyping = () => {
    if (!socket) {
      toast.error("You are not connected to the server");
      return;
    }

    if (!recipient) {
      toast.error("Recipient not found");
      return;
    }

    setIsTyping(true);
    socket.emit("typing", { recipient, username });
  };

  if (!recipient) {
    redirect("/");
    return null;
  }

  if (!username) {
    toast.error("You are not authenticated");
    redirect("/");
    return null;
  }

  return (
    <ChatContainer
      recipient={recipient}
      messages={messages[recipient]}
      onSend={sendMessage}
      onLeave={() => clearMessages(recipient)}
      isTyping={isTyping}
      sendTyping={handleTyping}
      username={username}
    />
  );
};
