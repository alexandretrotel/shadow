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

export function useChat(): ChatActions {
  const {
    roomName,
    username,
    participants,
    addMessage,
    setParticipants,
    addTypingUser,
    removeTypingUser,
    setRoomName,
    setUsername,
    reset,
  } = useChatStore();

  useEffect(() => {
    socketService.onPublicKeys(({ username, publicKey }) => {
      const pubKey = decodeBase64(publicKey);
      setParticipants(
        participants.some((p) => p.username === username)
          ? participants
          : [...participants, { username, publicKey: pubKey }],
      );
    });

    socketService.onMessage((msg) => {
      const encrypted = decodeBase64(msg.content);
      const nonce = encrypted.slice(0, nacl.box.nonceLength);
      const ciphertext = encrypted.slice(nacl.box.nonceLength);
      const senderPubKey = participants.find(
        (p) => p.username === msg.sender,
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
    });

    socketService.onError((msg) => alert(msg));

    socketService.onTyping((username) => {
      addTypingUser(username);
      setTimeout(() => removeTypingUser(username), 2000);
    });

    return () => {
      socketService.disconnect();
    };
  }, [
    participants,
    addMessage,
    addTypingUser,
    removeTypingUser,
    setParticipants,
  ]);

  const joinRoom = (roomName: string, password: string, username: string) => {
    const keys = nacl.box.keyPair();
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
    const messageId = socketService.sendMessage(
      roomName,
      content,
      participants,
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

export const useChatState = () => {
  return useChatStore((state) => ({
    roomName: state.roomName,
    username: state.username,
    messages: state.messages,
    participants: state.participants,
    typingUsers: state.typingUsers,
  }));
};
