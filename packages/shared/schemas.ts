import { z } from "zod";

export const userSchema = z.object({
  username: z.string().min(1).max(30),
  publicKey: z.string().refine(
    (val) => {
      try {
        const decoded = Buffer.from(val, "base64");
        return decoded.length === 32; // NaCl public key length
      } catch {
        return false;
      }
    },
    { message: "Invalid public key format" }
  ),
});

export const messageSchema = z.object({
  recipient: z.string().min(1).max(30),
  encryptedContent: z.string(),
  timer: z.number().min(0).optional(),
  messageId: z.string(),
});

export const typingSchema = z.object({
  recipient: z.string().min(1).max(30),
  username: z.string().min(1).max(30),
});

export const usernameSchema = z.object({
  username: z.string(),
});

export const usernameAndPubKeySchema = z.object({
  username: z.string(),
  publicKey: z.string(),
});
