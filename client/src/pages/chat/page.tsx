import { useEffect, useMemo, useState } from "react";
import { ChatContainer } from "@/components/chat/chat-container";
import { Message } from "@/lib/types";
import { useSocket } from "@/store/socket.store";
import { toast } from "sonner";
import { useChat } from "@/store/chat.store";
import { redirect, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/store/auth.store";
import { debounce } from "lodash";
import { decryptMessage, encryptMessage } from "@/lib/crypto";
import { usePublicKey } from "@/hooks/use-public-key";
import { decode } from "@stablelib/base64";

export const Chat = () => {
  const { recipient } = useParams<{ recipient: string }>();

  const [isTyping, setIsTyping] = useState(false);

  const { socket, closeSocket } = useSocket();
  const { username, getKeyPair } = useAuth();
  const { messages, addMessage, updateMessageStatus } = useChat();
  const navigate = useNavigate();
  const recipientPublicKey = usePublicKey(recipient);

  const keyPair = getKeyPair();
  const privateKey = keyPair?.secretKey;
  const publicKey = keyPair?.publicKey;

  const debouncedSendMessage = useMemo(
    () =>
      debounce((content: string) => {
        if (!socket || !username || !recipient) {
          toast.error("Connection or authentication issue");
          redirect("/");
          return;
        }

        if (!recipientPublicKey || !privateKey) {
          toast.error("Recipient public key or your private key is missing");
          return;
        }

        const encryptedContent = encryptMessage(
          content,
          decode(recipientPublicKey),
          privateKey,
        );

        const message: Message = {
          sender: username,
          content: encryptedContent,
          messageId: crypto.randomUUID(),
          status: "sent",
        };

        socket.emit("message", { sender: username, recipient, message });
      }, 300),
    [socket, username, recipient, recipientPublicKey, privateKey],
  );

  const debouncedHandleTyping = useMemo(
    () =>
      debounce(() => {
        if (!socket || !username || !recipient) {
          toast.error("Connection or authentication issue");
          return;
        }
        socket.emit("typing", { sender: username, recipient });
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
      socket.off("recipientOffline").on("recipientOffline", ({ recipient }) => {
        toast.error(`Message could not be delivered. ${recipient} is offline.`);
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
      socket.off("recipientOffline");
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
    updateMessageStatus,
  ]);

  const handleSendMessage = (content: string) => {
    debouncedSendMessage(content);
  };

  const handleTyping = () => {
    debouncedHandleTyping();
  };

  if (!recipient || !username || !publicKey) {
    toast.error("Authentication or recipient issue");
    redirect("/");
    return null;
  }

  const decryptedMessages =
    messages[recipient]?.map((msg) => {
      if (!privateKey || !recipientPublicKey) {
        return msg;
      }

      try {
        const decryptedContent = decryptMessage(
          msg.content,
          decode(recipientPublicKey),
          privateKey,
        );

        return { ...msg, content: decryptedContent };
      } catch {
        return { ...msg, content: "[Decryption Failed]" };
      }
    }) || [];

  return (
    <ChatContainer
      recipient={recipient}
      messages={decryptedMessages}
      onSend={handleSendMessage}
      onLeave={() => navigate("/")}
      isTyping={isTyping}
      sendTyping={handleTyping}
      username={username}
    />
  );
};
