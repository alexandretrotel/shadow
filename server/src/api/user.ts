import { Router } from "express";
import { db } from "../../../shared/db";
import { users } from "../../../shared/db/schema";
import { eq } from "drizzle-orm";
import {
  usernameSchema,
  usernameAndPubKeySchema,
} from "../../../shared/src/schemas";
import { decode as decodeBase64 } from "@stablelib/base64";
import nacl from "tweetnacl";

export const userRouter = Router();

userRouter.post("/register", async (req, res) => {
  const { username, publicKey } = usernameAndPubKeySchema.parse(req.body);
  const decodedKey = decodeBase64(publicKey);
  if (decodedKey.length !== nacl.box.publicKeyLength) {
    res.status(400).json({ error: "Invalid public key length" });
    return;
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing.length > 0) {
    if (existing[0].publicKey !== publicKey) {
      res.status(409).json({ error: "Username taken with different key" });
      return;
    }
    res.status(200).json({ message: "User already registered" });
    return;
  }

  await db.insert(users).values({ username, publicKey });
  res.status(201).json({ message: "User registered" });
});

userRouter.get("/username/:username", async (req, res) => {
  const { username } = usernameSchema.parse(req.params);
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  res.status(200).json({ available: existing.length === 0 });
});

userRouter.get("/publicKey/:username", async (req, res) => {
  const { username } = usernameSchema.parse(req.params);
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (user.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ publicKey: user[0].publicKey });
});
