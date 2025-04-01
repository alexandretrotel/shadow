import express from "express";
import { db } from "@shared/db";
import { eq } from "drizzle-orm";
import { contacts, users } from "@shared/db/schema";
import {
  addContactSchema,
  privateKeySchema,
  usernameAndPublicKeySchema,
  usernameSchema,
} from "@shared/src/schemas";
import { getPublicKeyFromPrivateKey } from "@shared/src/crypto";
import {
  decode as decodeBase64,
  encode as encodeBase64,
} from "@stablelib/base64";

export function setupRoutes(app: express.Express) {
  app.post("/register", async (req, res) => {
    const { username, publicKey } = usernameAndPublicKeySchema.parse(req.body);

    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .execute();

      if (existingUser.length > 0) {
        res.status(409).json({ error: "Username taken" });
      }

      await db.insert(users).values({ username, publicKey }).execute();

      res.status(201).json({ message: "User registered" });
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/login", async (req, res) => {
    const { privateKey } = privateKeySchema.parse(req.body);
    const publicKey = getPublicKeyFromPrivateKey(decodeBase64(privateKey));
    const encodedPublicKey = encodeBase64(publicKey);

    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.publicKey, encodedPublicKey))
        .execute();

      if (user.length === 0) {
        res.status(401).json({ error: "Invalid credentials" });
      }

      res.status(200).json({ message: "Login successful" });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/contacts", async (req, res) => {
    const { username } = usernameSchema.parse(req.query);

    const userContacts = await db
      .select({ contactUsername: contacts.contactUsername })
      .from(contacts)
      .where(eq(contacts.username, username))
      .execute();

    res.json(userContacts.map((c) => c.contactUsername));
  });

  app.post("/contacts", async (req, res) => {
    const { username, contactUsername } = addContactSchema.parse(req.body);

    try {
      await db.insert(contacts).values({ username, contactUsername }).execute();

      res.status(201).json({ message: "Contact added" });
    } catch (error) {
      res.status(500).json({ error: "Failed to add contact" });
    }
  });
}
