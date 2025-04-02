export interface Message {
  messageId: string;
  sender: string;
  content: string;
  status?: "sent" | "delivered" | "failed" | "received";
  timestamp?: string;
}
