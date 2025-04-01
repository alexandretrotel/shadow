export interface Message {
  sender: string;
  content: string;
  timer?: number;
  status?: "sent" | "delivered" | "failed" | "read";
  messageId: string;
}
