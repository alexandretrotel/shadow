import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import nacl from "tweetnacl";
import { encode as encodeBase64 } from "@stablelib/base64";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateKey(): string {
  const randomBytes = nacl.randomBytes(16);
  return encodeBase64(randomBytes).slice(0, 20);
}
