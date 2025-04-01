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
    addContact,
  } = useChatStore();

  const editMessage = (messageId: string, content: string) => {
    const recipientPublicKey = contacts.find(
      (c) => c.username === currentRecipient,
    )?.publicKey;
    if (recipientPublicKey) {
      socketService.editMessage(
        currentRecipient,
        messageId,
        content,
        recipientPublicKey,
      );
      useChatStore.setState((state) => ({
        ...state,
        messages: state.messages.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, content, status: "sent" }
            : msg,
        ),
      }));
    }
  };

  const deleteMessage = (messageId: string) => {
    socketService.deleteMessage(currentRecipient, messageId);
    useChatStore.setState((state) => ({
      ...state,
      messages: state.messages.filter((msg) => msg.messageId !== messageId),
    }));
  };

  const reactToMessage = (messageId: string, reaction: string) => {
    const currentMessage = useChatStore
      .getState()
      .messages.find((msg) => msg.messageId === messageId);
    const userReaction = currentMessage?.reactions?.find(
      (r) => r.sender === username && r.reaction === reaction,
    );
    if (userReaction) {
      toast.info("You’ve already reacted with this emoji.");
      return;
    }
    socketService.reactToMessage(currentRecipient, messageId, reaction);
    useChatStore.setState((state) => ({
      ...state,
      messages: state.messages.map((msg) =>
        msg.messageId === messageId
          ? {
              ...msg,
              reactions: [
                ...(msg.reactions || []),
                { sender: username, reaction },
              ],
            }
          : msg,
      ),
    }));
  };

  useEffect(() => {
    if (username && !socketService.getKeyPair()) {
      const keys = nacl.box.keyPair();
      socketService.setKeyPair(keys);
      socketService.register(username, encodeBase64(keys.publicKey));
    }

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
          type: msg.content.startsWith("[FILE:")
            ? "file"
            : msg.content.startsWith("[VOICE:")
              ? "voice"
              : "text",
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

    const handleError = (msg: string) => {
      console.error(msg);
      toast.error(msg);
    };

    const handleTyping = (username: string) => {
      addTypingUser(username);
      setTimeout(() => removeTypingUser(username), 2000);
    };

    const handleMessageEdited = ({
      messageId,
      encryptedContent,
    }: {
      messageId: string;
      encryptedContent: string;
    }) => {
      const encrypted = decodeBase64(encryptedContent);
      const nonce = encrypted.slice(0, nacl.box.nonceLength);
      const ciphertext = encrypted.slice(nacl.box.nonceLength);
      const senderPubKey = contacts.find(
        (c) => c.username === currentRecipient,
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
        useChatStore.setState((state) => ({
          ...state,
          messages: state.messages.map((msg) =>
            msg.messageId === messageId
              ? { ...msg, content, status: "delivered" }
              : msg,
          ),
        }));
      }
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      useChatStore.setState((state) => ({
        ...state,
        messages: state.messages.filter((msg) => msg.messageId !== messageId),
      }));
    };

    const handleMessageReaction = ({
      messageId,
      sender,
      reaction,
    }: {
      messageId: string;
      sender: string;
      reaction: string;
    }) => {
      useChatStore.setState((state) => ({
        ...state,
        messages: state.messages.map((msg) =>
          msg.messageId === messageId
            ? {
                ...msg,
                reactions: [...(msg.reactions || []), { sender, reaction }],
              }
            : msg,
        ),
      }));
    };

    const handlePublicKeys = ({
      username: contactUsername,
      publicKey,
    }: {
      username: string;
      publicKey: string;
    }) => {
      const pubKey = decodeBase64(publicKey);
      addContact({ username: contactUsername, publicKey: pubKey });
    };

    socketService.onPublicKeys(handlePublicKeys);
    socketService.onMessage(handleMessage);
    socketService.onError(handleError);
    socketService.onTyping(handleTyping);
    socketService.onMessageEdited(handleMessageEdited);
    socketService.onMessageDeleted(handleMessageDeleted);
    socketService.onMessageReaction(handleMessageReaction);
    socketService.onPublicKeys(handlePublicKeys);

    return () => {
      socketService.getSocket().off("publicKeys", handlePublicKeys);
      socketService.getSocket().off("message", handleMessage);
      socketService.getSocket().off("error", handleError);
      socketService.getSocket().off("typing", handleTyping);
      socketService.getSocket().off("messageEdited", handleMessageEdited);
      socketService.getSocket().off("messageDeleted", handleMessageDeleted);
      socketService.getSocket().off("messageReaction", handleMessageReaction);
      socketService.getSocket().off("publicKeys", handlePublicKeys);
    };
  }, [
    username,
    currentRecipient,
    contacts,
    addMessage,
    addTypingUser,
    removeTypingUser,
    addContact,
  ]);

  const startChat = (recipient: string) => {
    if (!contacts.some((c) => c.username === recipient)) {
      socketService.requestPublicKey(recipient);
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
        type: content.startsWith("[FILE:")
          ? "file"
          : content.startsWith("[VOICE:")
            ? "voice"
            : "text",
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

      socketService
        .getSocket()
        .emit("messageStatus", { messageId, status: "sent" });
    } else {
      toast.error("Failed to send message.");
    }
  };

  const leaveChat = () => {
    useChatStore.setState((state) => ({
      ...state,
      messages: [],
      typingUsers: [],
      currentRecipient: "",
    }));
    socketService.disconnect();
    socketService.getSocket().connect();
  };

  const sendTyping = debounce(() => {
    if (currentRecipient) {
      socketService.sendTyping(currentRecipient, username);
    }
  }, 500);

  const getKeyFingerprint = (key: Uint8Array) => {
    const hash = nacl.hash(key);
    return encodeBase64(hash.slice(0, 8));
  };

  return {
    sendMessage,
    sendTyping,
    getKeyFingerprint,
    editMessage,
    deleteMessage,
    reactToMessage,
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
