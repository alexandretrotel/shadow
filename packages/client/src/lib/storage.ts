import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import nacl from "tweetnacl";

export const storeKeyPair = (keyPair: nacl.BoxKeyPair) => {
  localStorage.setItem(
    "chatKeyPair",
    JSON.stringify({
      publicKey: encodeBase64(keyPair.publicKey),
      secretKey: encodeBase64(keyPair.secretKey),
    }),
  );
};

export const getKeyPair = (): nacl.BoxKeyPair | null => {
  const stored = localStorage.getItem("chatKeyPair");
  if (!stored) return null;
  const { publicKey, secretKey } = JSON.parse(stored);
  return {
    publicKey: decodeBase64(publicKey),
    secretKey: decodeBase64(secretKey),
  };
};

export const clearKeyPair = () => localStorage.removeItem("chatKeyPair");
