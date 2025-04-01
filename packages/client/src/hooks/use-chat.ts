import { useEffect } from "react";
import nacl from "tweetnacl";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { socketService } from "@/lib/socket-service";
import { ChatActions, Message } from "@/types/chat";
import { debounce } from "lodash";
import { useChatStore } from "@/store/chat-store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

export function useChat(): ChatActions {
  const {
    username,
    currentRecipient,
    contacts,
    addMessage,
    addTypingUser,
    removeTypingUser,
    setCurrentRecipient,
  } = useChatStore();

  useEffect(() => {
    const handleMessage = (msg: Message) => {
      const encrypted = decodeBase64(msg.content);
      const nonce = encrypted.slice(0, nacl.box.nonceLength);
      const ciphertext = encrypted.slice(nacl.box.nonceLength);
      const senderPubKey = contacts.find(
        (c) => c.username === msg.sender,
      )?.publicKey;
      const keyPair = socketService.getKeyPair();

      if (senderPubKey && keyPair) {
        const decrypted = nacl.box.open(
          ciphertext,
          nonce,
          senderPubKey,
          keyPair.secretKey,
        );
        const content = decrypted
          ? new TextDecoder().decode(decrypted)
          : "Decryption failed";
        const newMsg = {
          ...msg,
          content,
          status: decrypted ? "delivered" : "failed",
        } as Message;
        addMessage(newMsg);
        if (newMsg.timer) {
          setTimeout(() => {
            useChatStore.setState((state) => ({
              ...state,
              messages: state.messages.filter(
                (m) => m.messageId !== newMsg.messageId,
              ),
            }));
          }, newMsg.timer * 1000);
        }
      }
    };

    const handleMessageStatus = ({
      messageId,
      status,
      reason,
    }: {
      messageId: string;
      status: string;
      reason?: string;
    }) => {
      useChatStore.setState((state) => ({
        ...state,
        messages: state.messages.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, status: status as Message["status"] }
            : msg,
        ),
      }));
      if (status === "failed") toast.error(`Message failed: ${reason}`);
    };

    const handleTyping = (username: string) => {
      addTypingUser(username);
      setTimeout(() => removeTypingUser(username), 2000);
    };

    socketService.onMessage(handleMessage);
    socketService.onMessageStatus(handleMessageStatus);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.getSocket().off("message", handleMessage);
      socketService.getSocket().off("messageStatus", handleMessageStatus);
      socketService.getSocket().off("typing", handleTyping);
    };
  }, [
    username,
    currentRecipient,
    contacts,
    addMessage,
    addTypingUser,
    removeTypingUser,
  ]);

  const startChat = async (recipient: string) => {
    if (!contacts.some((c) => c.username === recipient)) {
      try {
        const { username: contactUsername, publicKey } =
          await socketService.getPublicKey(recipient);
        useChatStore.getState().addContact({
          username: contactUsername,
          publicKey: decodeBase64(publicKey),
        });
      } catch {
        toast.error(`Failed to start chat: ${recipient} not found`);
        return;
      }
    }
    setCurrentRecipient(recipient);
  };

  const sendMessage = (content: string, timer?: number) => {
    if (!socketService.getKeyPair() || !currentRecipient) {
      toast.error("Cannot send message: Encryption keys or recipient not set.");
      return;
    }
    const recipientPublicKey = contacts.find(
      (c) => c.username === currentRecipient,
    )?.publicKey;
    if (!recipientPublicKey) {
      toast.error("Recipient’s public key not found.");
      return;
    }
    const messageId = socketService.sendMessage(
      currentRecipient,
      content,
      recipientPublicKey,
      timer,
    );
    if (messageId) {
      const msg = {
        sender: username,
        content,
        timer,
        status: "sent" as const,
        messageId,
      } as Message;
      addMessage(msg);
      if (timer) {
        setTimeout(() => {
          useChatStore.setState((state) => ({
            ...state,
            messages: state.messages.filter((m) => m.messageId !== messageId),
          }));
        }, timer * 1000);
      }
    }
  };

  const leaveChat = () => {
    useChatStore.setState((state) => ({
      ...state,
      messages: [],
      typingUsers: [],
      currentRecipient: "",
    }));
  };

  const sendTyping = debounce(() => {
    if (currentRecipient) socketService.sendTyping(currentRecipient, username);
  }, 500);

  const getKeyFingerprint = (key: Uint8Array) => {
    const hash = nacl.hash(key);
    return encodeBase64(hash.slice(0, 8));
  };

  return {
    sendMessage,
    sendTyping,
    getKeyFingerprint,
    editMessage: () => {},
    deleteMessage: () => {},
    reactToMessage: () => {},
    startChat,
    leaveChat,
  };
}

export const useChatState = () =>
  useChatStore(
    useShallow((state) => ({
      username: state.username,
      messages: state.messages,
      typingUsers: state.typingUsers,
      currentRecipient: state.currentRecipient,
      contacts: state.contacts,
    })),
  );
