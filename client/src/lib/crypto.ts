import nacl from "tweetnacl";
import { encode, decode } from "@stablelib/base64";

/**
 * Generates a new public-private key pair for encryption.
 * @returns {nacl.BoxKeyPair} A key pair containing a public and secret key.
 */
export const generateKeyPair = (): nacl.BoxKeyPair => nacl.box.keyPair();

/**
 * Encrypts a message using NaCl box encryption.
 * @param {string} content - The plaintext message to encrypt.
 * @param {Uint8Array} recipientPublicKey - The recipient's public key.
 * @param {Uint8Array} secretKey - The sender's secret (private) key.
 * @returns {string} The encrypted message, encoded in Base64.
 */
export const encryptMessage = (
  content: string,
  recipientPublicKey: Uint8Array,
  secretKey: Uint8Array,
): string => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(
    new TextEncoder().encode(content),
    nonce,
    recipientPublicKey,
    secretKey,
  );
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  return encode(fullMessage);
};

/**
 * Decrypts a NaCl box-encrypted message.
 * @param {string} encryptedContent - The encrypted message in Base64 format.
 * @param {Uint8Array} senderPublicKey - The sender's public key.
 * @param {Uint8Array} secretKey - The recipient's secret (private) key.
 * @returns {string} The decrypted message as a UTF-8 string, or an error message if decryption fails.
 */
export const decryptMessage = (
  encryptedContent: string,
  senderPublicKey: Uint8Array,
  secretKey: Uint8Array,
): string => {
  const encrypted = decode(encryptedContent);
  const nonce = encrypted.slice(0, nacl.box.nonceLength);
  const ciphertext = encrypted.slice(nacl.box.nonceLength);
  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    senderPublicKey,
    secretKey,
  );
  return decrypted ? new TextDecoder().decode(decrypted) : "Decryption failed";
};

/**
 * Generates a fingerprint (short hash) for a given cryptographic key.
 * @param {Uint8Array} key - The cryptographic key to hash.
 * @returns {string} A Base64-encoded fingerprint (first 8 bytes of the hash).
 */
export const getKeyFingerprint = (key: Uint8Array): string => {
  const hash = nacl.hash(key);
  return encode(hash.slice(0, 8));
};

/**
 * Derives the public key from a given private (secret) key.
 * @param {Uint8Array} secretKey - The secret (private) key.
 * @returns {Uint8Array} The corresponding public key.
 */
export const getPublicKeyFromPrivateKey = (
  secretKey: Uint8Array,
): Uint8Array => {
  return nacl.box.keyPair.fromSecretKey(secretKey).publicKey;
};
