import express from "express";
import { db } from "../../common/db";
import { eq } from "drizzle-orm";
import { users } from "../../common/db/schema";
import {
  privateKeySchema,
  usernameAndPublicKeySchema,
} from "../../common/src/schemas";
import { getPublicKeyFromPrivateKey } from "../../common/src/crypto";
import { decode, encode } from "@stablelib/base64";
import nacl from "tweetnacl";

export function setupRoutes(app: express.Express) {
  app.post("/register", async (req, res) => {
    const { username, publicKey } = usernameAndPublicKeySchema.parse(req.body);

    try {
      // Check if the username already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .execute();

      if (existingUser.length > 0) {
        res.status(409).json({ error: "Username taken" });
      }

      // Insert the new user into the database
      await db.insert(users).values({ username, publicKey }).execute();

      res.status(201).json({ message: "User registered" });
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/login", async (req, res) => {
    const { privateKey } = privateKeySchema.parse(req.body);
    const publicKey = getPublicKeyFromPrivateKey(decode(privateKey));
    const encodedPublicKey = encode(publicKey);

    try {
      // Check if the user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.publicKey, encodedPublicKey))
        .execute();

      if (user.length === 0) {
        res.status(401).json({ error: "Invalid credentials" });
      }

      // Return username and a simple session token
      const sessionToken = encode(nacl.randomBytes(16)); // Temporary token

      res.status(200).json({
        message: "Login successful",
        username: user[0].username,
        sessionToken,
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/public-key/:username", async (req, res) => {
    const { username } = req.params;

    try {
      // Fetch the user's public key from the database
      const user = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .execute();

      if (user.length === 0) {
        res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ publicKey: user[0].publicKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch public key" });
    }
  });
}
