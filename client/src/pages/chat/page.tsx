import { useEffect, useState } from "react";
import { ChatContainer } from "@/components/chat/chat-container";
import { Message } from "@/lib/types";
import { useSocket } from "@/store/socket.store";
import { toast } from "sonner";
import { useChat } from "@/store/chat.store";
import { redirect, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/store/auth.store";

export const Chat = () => {
  const { recipient } = useParams<{ recipient: string }>();

  const [isTyping, setIsTyping] = useState(false);

  const { socket, closeSocket } = useSocket();
  const { username } = useAuth();
  const { messages, addMessage } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !recipient || !username) {
      if (!socket) toast.error("Not connected to the server");
      if (!recipient) toast.error("Recipient not found");
      if (!username) toast.error("You are not authenticated");
      return;
    }

    // Function to attach event listeners
    const attachListeners = () => {
      socket.on("message", (msg: Message) => addMessage(recipient, msg));
      socket.on("typing", () => setIsTyping(true));
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
      socket.off("reconnect");
    };
  }, [socket, addMessage, closeSocket, recipient, username]);

  const sendMessage = (content: string) => {
    if (!socket) {
      toast.error("You are not connected to the server");
      return;
    }

    if (!username) {
      toast.error("You are not authenticated");
      redirect("/");
      return;
    }

    if (!recipient) {
      toast.error("Recipient not found");
      return;
    }

    const message: Message = {
      sender: username,
      content,
      messageId: Date.now().toString(),
      status: "sent",
    };

    socket.emit("message", { recipient, message });

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

    if (!username) {
      toast.error("You are not authenticated");
      redirect("/");
      return;
    }

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
      onLeave={() => navigate("/")}
      isTyping={isTyping}
      sendTyping={handleTyping}
      username={username}
    />
  );
};
