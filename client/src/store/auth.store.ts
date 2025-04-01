import { create } from "zustand";
import nacl from "tweetnacl";

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

// AES-GCM configuration
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

// Derive an encryption key from the password using PBKDF2
const deriveKey = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as a key for PBKDF2
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Derive a 256-bit AES-GCM key
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("shadow-salt"), // Consistent salt; consider per-user salts in production
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

// Encrypt data with AES-GCM
const encryptData = async (data: string, password: string): Promise<string> => {
  const key = await deriveKey(password);
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedData,
  );

  // Convert IV and encrypted data to hex strings and combine them
  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const encryptedHex = Array.from(new Uint8Array(encrypted))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${ivHex}:${encryptedHex}`;
};

// Decrypt data with AES-GCM
const decryptData = async (
  encryptedData: string,
  password: string,
): Promise<string | null> => {
  try {
    const [ivHex, encryptedHex] = encryptedData.split(":");
    if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted format");

    const key = await deriveKey(password);
    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );
    const encryptedBuffer = new Uint8Array(
      encryptedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedBuffer,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
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
      throw new Error("Decryption failed");
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
