import { create } from "zustand";
import { persist } from "zustand/middleware";
import nacl from "tweetnacl";
import crypto from "crypto";

interface AuthStore {
  username: string | null;
  keyPair: string | null;
  setUsername: (username: string, password: string) => void;
  setKeyPair: (keyPair: nacl.BoxKeyPair, password: string) => void;
  clearAuth: () => void;
}

// AES Configuration
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

const deriveKey = async (password: string) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("your-salt"), // Change to a randomly stored salt per user
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

const encryptData = async (data: string, password: string): Promise<string> => {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedData = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedData,
  );

  return `${Buffer.from(iv).toString("hex")}:${Buffer.from(encrypted).toString("hex")}`;
};

const decryptData = async (
  encryptedData: string,
  password: string,
): Promise<string | null> => {
  try {
    const [ivHex, encryptedHex] = encryptedData.split(":");
    if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted format");

    const key = await deriveKey(password);
    const iv = new Uint8Array(Buffer.from(ivHex, "hex"));
    const encryptedBuffer = Buffer.from(encryptedHex, "hex");

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedBuffer,
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      username: null,
      keyPair: null,

      setUsername: async (username: string, password: string) => {
        const encryptedUsername = await encryptData(username, password);
        set({ username: encryptedUsername });
      },

      setKeyPair: async (keyPair: nacl.BoxKeyPair, password: string) => {
        const encryptedKeyPair = await encryptData(
          JSON.stringify(keyPair),
          password,
        );
        set({ keyPair: encryptedKeyPair });
      },

      clearAuth: () => set({ username: null, keyPair: null }),
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: async (name) => {
          const encrypted = localStorage.getItem(name);
          if (!encrypted) return null;
          return await decryptData(encrypted, "user-password"); // Replace with user input
        },
        setItem: async (name, value) => {
          const encrypted = await encryptData(value, "user-password"); // Replace with user input
          localStorage.setItem(name, encrypted);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
