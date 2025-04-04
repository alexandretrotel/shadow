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
import { decode, encode } from "@stablelib/base64";
import { useContacts } from "@/store/contacts.store";

export const Chat = () => {
  const { recipient } = useParams<{ recipient: string }>();
  const [isTyping, setIsTyping] = useState(false);

  const { socket, closeSocket } = useSocket();
  const { getKeyPair } = useAuth();
  const { messages, addMessage } = useChat();
  const { getContactPublicKey, getContactName } = useContacts();
  const navigate = useNavigate();

  const keyPair = getKeyPair();
  const privateKey = keyPair?.secretKey;
  const publicKey = keyPair ? encode(keyPair.publicKey) : null;
  const recipientPublicKey = getContactPublicKey(recipient!);

  const debouncedSendMessage = useMemo(
    () =>
      debounce((content: string) => {
        if (!socket || !recipient || !publicKey) {
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
          sender: publicKey,
          content: encryptedContent,
          messageId: crypto.randomUUID(),
          status: "sent",
        };

        socket.emit("message", {
          sender: publicKey,
          recipient: recipientPublicKey,
          message,
        });
      }, 300),
    [socket, recipient, publicKey, recipientPublicKey, privateKey],
  );

  const debouncedHandleTyping = useMemo(
    () =>
      debounce(() => {
        if (!socket || !recipientPublicKey || !publicKey) {
          toast.error("Connection or authentication issue");
          return;
        }
        socket.emit("typing", {
          sender: publicKey,
          recipient: recipientPublicKey,
        });
      }, 500),
    [socket, publicKey, recipientPublicKey],
  );

  useEffect(() => {
    if (!socket || !recipient || !publicKey) {
      if (!socket) toast.error("Not connected to the server");
      if (!recipient) toast.error("Recipient not found");
      if (!publicKey) toast.error("You are not authenticated");
      return;
    }

    const attachListeners = () => {
      socket
        .off("message")
        .on("message", (msg: Message) => addMessage(recipient, msg));
      socket.off("typing").on("typing", () => setIsTyping(true));
      socket.off("stopTyping").on("stopTyping", () => setIsTyping(false));
      socket.off("recipientOffline").on("recipientOffline", () => {
        toast.error(
          `Message could not be delivered. Your recipient is offline.`,
        );
      });
    };

    attachListeners();
    socket.on("reconnect", attachListeners);

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
    publicKey,
    debouncedSendMessage,
    debouncedHandleTyping,
  ]);

  const handleSendMessage = (content: string) => debouncedSendMessage(content);
  const handleTyping = () => debouncedHandleTyping();

  if (!recipient || !publicKey || !recipientPublicKey) {
    toast.error("Authentication or recipient issue");
    redirect("/");
    return null;
  }

  const decryptedMessages =
    messages[recipient]?.map((msg) => {
      if (!privateKey || !recipientPublicKey) return msg;

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
      recipient={getContactName(recipient) || recipient}
      messages={decryptedMessages}
      onSend={handleSendMessage}
      onLeave={() => navigate("/")}
      isTyping={isTyping}
      sendTyping={handleTyping}
      username={publicKey}
    />
  );
};
