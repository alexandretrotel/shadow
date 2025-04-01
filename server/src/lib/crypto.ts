import nacl from "tweetnacl";

/**
 * Derives the public key from a given private (secret) key.
 * @param {Uint8Array} secretKey - The secret (private) key.
 * @returns {Uint8Array} The corresponding public key.
 */
export const getPublicKeyFromPrivateKey = (
  secretKey: Uint8Array
): Uint8Array => {
  return nacl.box.keyPair.fromSecretKey(secretKey).publicKey;
};
