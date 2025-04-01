import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    username: text("username").notNull().unique(),
    publicKey: text("public_key").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (users) => [primaryKey({ columns: [users.username, users.publicKey] })]
);

export const contacts = pgTable(
  "contacts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.username),
    contactId: text("contact_id")
      .notNull()
      .references(() => users.username),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (contacts) => [primaryKey({ columns: [contacts.userId, contacts.contactId] })]
);
