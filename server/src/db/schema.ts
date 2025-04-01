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
  (users) => [
    primaryKey({ columns: [users.username, users.publicKey] }),
    uniqueIndex("username_idx").on(users.username),
  ]
);
