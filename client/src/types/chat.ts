export interface Message {
  sender: string;
  content: string;
  timer?: number;
  status?: "sent" | "delivered" | "failed";
  messageId: string;
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
  joinRoom: (roomName: string, password: string, username: string) => void;
  sendMessage: (content: string, timer?: number) => void;
  leaveRoom: () => void;
  sendTyping: () => void;
  getKeyFingerprint: (key: Uint8Array) => string;
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
}
