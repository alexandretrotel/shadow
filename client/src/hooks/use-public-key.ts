import { publicKeySchema } from "@/lib/schemas";
import { SERVER_URL } from "@/lib/server";
import { useContacts } from "@/store/contacts.store";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const usePublicKey = (recipient: string | undefined) => {
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(
    null,
  );

  const { getContactPublicKey } = useContacts();

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
      } catch {
        toast.error("Could not fetch recipient public key from the registry");
        setRecipientPublicKey(null);
      }
    };

    if (recipient) {
      if (recipient.startsWith("local-")) {
        setRecipientPublicKey(getContactPublicKey(recipient) ?? null);
      } else {
        fetchPublicKey();
      }
    } else {
      setRecipientPublicKey(null);
    }
  }, [getContactPublicKey, recipient]);

  return recipientPublicKey;
};
