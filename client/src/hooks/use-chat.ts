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
    roomName,
    username,
    addMessage,
    addTypingUser,
    removeTypingUser,
    setRoomName,
    setUsername,
    reset,
  } = useChatStore();

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

    socketService.onPublicKeys(handlePublicKeys);
    socketService.onMessage(handleMessage);
    socketService.onError(handleError);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.getSocket().off("publicKeys", handlePublicKeys);
      socketService.getSocket().off("message", handleMessage);
      socketService.getSocket().off("error", handleError);
      socketService.getSocket().off("typing", handleTyping);
      socketService.disconnect();
    };
  }, [addMessage, addTypingUser, removeTypingUser, roomName, username]);

  const joinRoom = (roomName: string, password: string, username: string) => {
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
