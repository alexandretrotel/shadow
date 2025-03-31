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
import { RoomFormData } from "@/lib/schemas";

export function useChat(): ChatActions {
  const {
    roomName,
    username,
    addMessage,
    addTypingUser,
    removeTypingUser,
    setRoomName,
    setUsername,
    reset,
  } = useChatStore();

  const editMessage = (messageId: string, content: string) => {
    socketService.editMessage(
      roomName,
      messageId,
      content,
      useChatStore.getState().participants,
    );
    useChatStore.setState((state) => ({
      ...state,
      messages: state.messages.map((msg) =>
        msg.messageId === messageId ? { ...msg, content, status: "sent" } : msg,
      ),
    }));
  };

  const deleteMessage = (messageId: string) => {
    socketService.deleteMessage(roomName, messageId);
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

    socketService.reactToMessage(roomName, messageId, reaction);
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
    if (roomName && username && !socketService.getKeyPair()) {
      const keys = nacl.box.keyPair();
      socketService.setKeyPair(keys);
      socketService.joinRoom(
        roomName,
        "storedPassword",
        username,
        encodeBase64(keys.publicKey),
      );
    }

    const handlePublicKeys = ({
      username,
      publicKey,
    }: {
      username: string;
      publicKey: string;
    }) => {
      const pubKey = decodeBase64(publicKey);
      useChatStore.setState((state) => {
        const alreadyExists = state.participants.some(
          (p) => p.username === username,
        );
        return {
          ...state,
          participants: alreadyExists
            ? state.participants
            : [...state.participants, { username, publicKey: pubKey }],
        };
      });
    };

    const handleMessage = (msg: Message) => {
      const encrypted = decodeBase64(msg.content);
      const nonce = encrypted.slice(0, nacl.box.nonceLength);
      const ciphertext = encrypted.slice(nacl.box.nonceLength);
      const senderPubKey = useChatStore
        .getState()
        .participants.find((p) => p.username === msg.sender)?.publicKey;
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

    const handleMessageStatus = ({
      messageId,
      status,
    }: {
      messageId: string;
      status: "read";
    }) => {
      useChatStore.setState((state) => ({
        ...state,
        messages: state.messages.map((msg) =>
          msg.messageId === messageId ? { ...msg, status } : msg,
        ),
      }));
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
      const senderPubKey = useChatStore
        .getState()
        .participants.find((p) => p.username !== username)?.publicKey;
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

    socketService.onPublicKeys(handlePublicKeys);
    socketService.onMessage(handleMessage);
    socketService.onError(handleError);
    socketService.onTyping(handleTyping);
    socketService.onMessageStatus(handleMessageStatus);
    socketService.onMessageEdited(handleMessageEdited);
    socketService.onMessageDeleted(handleMessageDeleted);
    socketService.onMessageReaction(handleMessageReaction);

    return () => {
      socketService.getSocket().off("publicKeys", handlePublicKeys);
      socketService.getSocket().off("message", handleMessage);
      socketService.getSocket().off("error", handleError);
      socketService.getSocket().off("typing", handleTyping);
      socketService.getSocket().off("messageStatus", handleMessageStatus);
      socketService.getSocket().off("messageEdited", handleMessageEdited);
      socketService.getSocket().off("messageDeleted", handleMessageDeleted);
      socketService.getSocket().off("messageReaction", handleMessageReaction);
    };
  }, [addMessage, addTypingUser, removeTypingUser, roomName, username]);

  const joinRoom = (data: RoomFormData) => {
    const { roomName, password, username } = data;

    const keys = socketService.getKeyPair() || nacl.box.keyPair();
    socketService.setKeyPair(keys);
    socketService.joinRoom(
      roomName,
      password,
      username,
      encodeBase64(keys.publicKey),
    );
    setRoomName(roomName);
    setUsername(username);
  };

  const sendMessage = (content: string, timer?: number) => {
    if (!socketService.getKeyPair()) {
      toast.error("Cannot send message: Encryption keys not initialized.");
      return;
    }
    const messageId = socketService.sendMessage(
      roomName,
      content,
      useChatStore.getState().participants,
      timer,
    );
    if (messageId) {
      const msg = {
        sender: username,
        content,
        timer,
        status: "sent",
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
    } else {
      toast.error("Failed to send message.");
    }
  };

  const leaveRoom = () => {
    socketService.leaveRoom(roomName);
    reset();
    socketService.setKeyPair(null);
  };

  const sendTyping = debounce(() => {
    socketService.sendTyping(roomName, username);
  }, 500);

  const getKeyFingerprint = (key: Uint8Array) => {
    const hash = nacl.hash(key);
    return encodeBase64(hash.slice(0, 8));
  };

  return {
    joinRoom,
    sendMessage,
    leaveRoom,
    sendTyping,
    getKeyFingerprint,
    editMessage,
    deleteMessage,
    reactToMessage,
  };
}

export const useChatState = () =>
  useChatStore(
    useShallow((state) => ({
      roomName: state.roomName,
      username: state.username,
      messages: state.messages,
      participants: state.participants,
      typingUsers: state.typingUsers,
    })),
  );
