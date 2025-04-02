import { publicKeySchema } from "@/lib/schemas";
import { SERVER_URL } from "@/lib/server";
import { useEffect, useState } from "react";

export const usePublicKey = (recipient: string) => {
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/public-key/${recipient}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch public key");
        }

        const data = await response.json();
        const { publicKey } = publicKeySchema.parse(data);
        setRecipientPublicKey(publicKey);
      } catch (error) {
        console.error("Error fetching public key:", error);
        setRecipientPublicKey(null);
      }
    };

    if (recipient) {
      fetchPublicKey();
    }
  }, [recipient]);

  return recipientPublicKey;
};
