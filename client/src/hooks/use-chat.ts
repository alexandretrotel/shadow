import { useState, useEffect } from "react";
import nacl from "tweetnacl";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { socketService } from "@/lib/socket-service";
import { ChatState, ChatActions, Message } from "@/types/chat";
import { debounce } from "lodash";

export function useChat(): ChatState & ChatActions {
  const [state, setState] = useState<ChatState>({
    roomName: "",
    username: "",
    messages: [],
    participants: [],
    typingUsers: [],
  });

  useEffect(() => {
    socketService.onPublicKeys(({ username, publicKey }) => {
      const pubKey = decodeBase64(publicKey);
      setState((prev) => ({
        ...prev,
        participants: prev.participants.some((p) => p.username === username)
          ? prev.participants
          : [...prev.participants, { username, publicKey: pubKey }],
      }));
    });

    socketService.onMessage((msg) => {
      const encrypted = decodeBase64(msg.content);
      const nonce = encrypted.slice(0, nacl.box.nonceLength);
      const ciphertext = encrypted.slice(nacl.box.nonceLength);
      const senderPubKey = state.participants.find(
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
        setState((prev) => ({ ...prev, messages: [...prev.messages, newMsg] }));
        if (newMsg.timer) {
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.filter(
                (m) => m.messageId !== newMsg.messageId,
              ),
            }));
          }, newMsg.timer * 1000);
        }
      }
    });

    socketService.onError((msg) => alert(msg));

    socketService.onTyping((username) => {
      setState((prev) => ({
        ...prev,
        typingUsers: [...new Set([...prev.typingUsers, username])],
      }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          typingUsers: prev.typingUsers.filter((u) => u !== username),
        }));
      }, 2000);
    });

    return () => {
      socketService.disconnect();
    };
  }, [state.participants]);

  const joinRoom = (roomName: string, password: string, username: string) => {
    const keys = nacl.box.keyPair();
    socketService.setKeyPair(keys);
    socketService.joinRoom(
      roomName,
      password,
      username,
      encodeBase64(keys.publicKey),
    );
    setState((prev) => ({ ...prev, roomName, username }));
  };

  const sendMessage = (content: string, timer?: number) => {
    const messageId = socketService.sendMessage(
      state.roomName,
      content,
      state.participants,
      timer,
    );
    if (messageId) {
      const msg = {
        sender: state.username,
        content,
        timer,
        status: "sent",
        messageId,
      } as Message;
      setState((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
      if (timer) {
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            messages: prev.messages.filter((m) => m.messageId !== messageId),
          }));
        }, timer * 1000);
      }
    }
  };

  const leaveRoom = () => {
    socketService.leaveRoom(state.roomName);
    setState({
      roomName: "",
      username: "",
      messages: [],
      participants: [],
      typingUsers: [],
    });
    socketService.setKeyPair(null);
  };

  const sendTyping = debounce(() => {
    socketService.sendTyping(state.roomName, state.username);
  }, 500);

  const getKeyFingerprint = (key: Uint8Array) => {
    const hash = nacl.hash(key);
    return encodeBase64(hash.slice(0, 8));
  };

  return {
    ...state,
    joinRoom,
    sendMessage,
    leaveRoom,
    sendTyping,
    getKeyFingerprint,
  };
}
