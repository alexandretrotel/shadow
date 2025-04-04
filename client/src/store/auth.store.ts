import { create } from "zustand";
import nacl from "tweetnacl";

interface AuthStore {
  isAuthenticated: boolean;
  keyPair: nacl.BoxKeyPair | null;
  setAuth: (keyPair: nacl.BoxKeyPair, password: string) => Promise<void>;
  loadAuth: (password: string) => Promise<void>;
  getKeyPair: () => nacl.BoxKeyPair | null;
  clearAuth: () => void;
}

// AES-GCM configuration
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

// Derive an encryption key from the password using PBKDF2
const deriveKey = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("shadow-salt"),
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

// Convert plain object back to Uint8Array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toUint8Array = (obj: any): Uint8Array => {
  const values = Object.values(obj).map((v) => Number(v));
  return new Uint8Array(values);
};

export const useAuth = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  keyPair: null,

  setAuth: async (keyPair: nacl.BoxKeyPair, password: string) => {
    const state = { keyPair };
    const serialized = JSON.stringify(state);
    const encrypted = await encryptData(serialized, password);
    localStorage.setItem("auth-storage", encrypted);
    set({ keyPair });
  },

  loadAuth: async (password: string) => {
    const encrypted = localStorage.getItem("auth-storage");
    if (!encrypted) return;

    const decrypted = await decryptData(encrypted, password);
    if (!decrypted) {
      throw new Error("Decryption failed");
    }

    const state = JSON.parse(decrypted);

    // Reconstruct Uint8Array from plain objects
    const reconstructedKeyPair = {
      publicKey: toUint8Array(state.keyPair.publicKey),
      secretKey: toUint8Array(state.keyPair.secretKey),
    };
    set({ keyPair: reconstructedKeyPair, isAuthenticated: true });
  },

  getKeyPair: () => {
    const state = get();
    return state.keyPair;
  },

  clearAuth: () => {
    set({ keyPair: null, isAuthenticated: false });
    localStorage.removeItem("auth-storage");
  },
}));
