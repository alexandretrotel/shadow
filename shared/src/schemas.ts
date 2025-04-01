import { z } from "zod";

export const usernameAndPublicKeySchema = z.object({
  username: z.string().min(1, "Username is required"),
  publicKey: z.string().min(1, "Public key is required"),
});

export const privateKeySchema = z.object({
  privateKey: z.string().min(1, "Private key is required"),
});

export const usernameSchema = z.object({
  username: z.string().min(1, "Username is required"),
});
