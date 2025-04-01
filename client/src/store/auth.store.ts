import { create } from "zustand";
import nacl from "tweetnacl";
import crypto from "crypto";

interface AuthStore {
  username: string | null;
  keyPair: nacl.BoxKeyPair | null;
  setAuth: (
    username: string,
    keyPair: nacl.BoxKeyPair,
    password: string,
  ) => Promise<void>;
  loadAuth: (password: string) => Promise<void>;
  getKeyPair: (password: string) => Promise<nacl.BoxKeyPair | null>;
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
      salt: encoder.encode("shadow-salt"), // Use a consistent salt; consider per-user salts in production
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

export const useAuth = create<AuthStore>((set) => ({
  username: null,
  keyPair: null,

  setAuth: async (
    username: string,
    keyPair: nacl.BoxKeyPair,
    password: string,
  ) => {
    const state = { username, keyPair };
    const serialized = JSON.stringify(state);
    const encrypted = await encryptData(serialized, password);
    localStorage.setItem("auth-storage", encrypted);
    set({ username, keyPair });
  },

  loadAuth: async (password: string) => {
    const encrypted = localStorage.getItem("auth-storage");
    if (!encrypted) return;

    const decrypted = await decryptData(encrypted, password);
    if (!decrypted) {
      console.error("Decryption failed");
      return;
    }

    const state = JSON.parse(decrypted);
    set({ username: state.username, keyPair: state.keyPair });
  },

  getKeyPair: async (password: string) => {
    const encrypted = localStorage.getItem("auth-storage");
    if (!encrypted) return null;

    const decrypted = await decryptData(encrypted, password);
    if (!decrypted) return null;

    const state = JSON.parse(decrypted);
    return state.keyPair as nacl.BoxKeyPair;
  },

  clearAuth: () => {
    set({ username: null, keyPair: null });
    localStorage.removeItem("auth-storage");
  },
}));
