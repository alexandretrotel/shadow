import nacl from "tweetnacl";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";

export const generateKeyPair = (): nacl.BoxKeyPair => nacl.box.keyPair();

export const encryptMessage = (
  content: string,
  recipientPublicKey: Uint8Array,
  secretKey: Uint8Array
): string => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(
    new TextEncoder().encode(content),
    nonce,
    recipientPublicKey,
    secretKey
  );
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  return encodeBase64(fullMessage);
};

export const decryptMessage = (
  encryptedContent: string,
  senderPublicKey: Uint8Array,
  secretKey: Uint8Array
): string => {
  const encrypted = decodeBase64(encryptedContent);
  const nonce = encrypted.slice(0, nacl.box.nonceLength);
  const ciphertext = encrypted.slice(nacl.box.nonceLength);
  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    senderPublicKey,
    secretKey
  );
  return decrypted ? new TextDecoder().decode(decrypted) : "Decryption failed";
};

export const getKeyFingerprint = (key: Uint8Array): string => {
  const hash = nacl.hash(key);
  return encodeBase64(hash.slice(0, 8));
};
