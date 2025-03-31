import { z } from "zod";

export const roomSchema = z.object({
  roomName: z.string().min(1, "Room name is required").max(50),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
  username: z.string().min(1, "Username is required").max(30),
});

export type RoomFormData = z.infer<typeof roomSchema>;
