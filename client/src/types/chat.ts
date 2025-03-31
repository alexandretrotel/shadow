import { RoomFormData } from "@/lib/schemas";

export interface Message {
  sender: string;
  content: string;
  timer?: number;
  status: "sent" | "delivered" | "read" | "failed";
  messageId: string;
  reactions?: { sender: string; reaction: string }[];
  type?: "text" | "file" | "voice";
}

export interface Participant {
  username: string;
  publicKey: Uint8Array;
}

export interface ChatState {
  roomName: string;
  username: string;
  messages: Message[];
  participants: Participant[];
  typingUsers: string[];
}

export interface ChatActions {
  joinRoom: (data: RoomFormData) => void;
  sendMessage: (content: string, timer?: number) => void;
  leaveRoom: () => void;
  sendTyping: () => void;
  getKeyFingerprint: (key: Uint8Array) => string;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  reactToMessage: (messageId: string, reaction: string) => void;
}

export interface ChatRoomProps {
  roomName: string;
  username: string;
  messages: Message[];
  participants: Participant[];
  onSend: (content: string, timer?: number) => void;
  onLeave: () => void;
  getKeyFingerprint: (key: Uint8Array) => string;
  typingUsers: string[];
  sendTyping: () => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
}
