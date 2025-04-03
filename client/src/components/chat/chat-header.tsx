import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { SERVER_URL } from "@/lib/server";
import { useChat } from "@/store/chat.store";
import { getKeyFingerprint } from "@/lib/crypto";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { publicKeySchema } from "@/lib/schemas";
import { decode } from "@stablelib/base64";
import { VerifyQR } from "./verify-qr";
import { featureFlags } from "@/lib/features";
import { useOnline } from "@/store/online.store";

interface ChatHeaderProps {
  recipient: string;
  onLeave: () => void;
}

export const ChatHeader = ({ recipient, onLeave }: ChatHeaderProps) => {
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(
    null,
  );
  const { isOnline } = useOnline();
  const { clearMessages, getNumberOfMessages } = useChat();

  useEffect(() => {
    const fetchRecipientPublicKey = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/public-key/${recipient}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Failed to fetch public key");

        const data = await response.json();
        const { publicKey } = publicKeySchema.parse(data);
        const decodedPublicKey = decode(publicKey);
        const newFingerprint = getKeyFingerprint(decodedPublicKey);

        const storedFingerprint = localStorage.getItem(
          `fingerprint_${recipient}`,
        );
        if (storedFingerprint && storedFingerprint !== newFingerprint) {
          toast.error(`Warning: Public key for ${recipient} has changed!`);
        }

        setRecipientPublicKey(publicKey);
      } catch {
        toast.error(
          `Failed to fetch public key for ${recipient}. Please try again.`,
        );
      }
    };

    fetchRecipientPublicKey();
  }, [recipient]);

  const fingerprint = recipientPublicKey
    ? getKeyFingerprint(decode(recipientPublicKey))
    : "Loading...";

  return (
    <CardHeader className="border-muted chat-header-bar flex-shrink-0 border-b px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline(recipient)
                  ? "animate-pulse bg-green-500"
                  : "bg-gray-400"
              }`}
            />
            <h2 className="text-secondary-foreground truncate text-lg font-medium">
              {recipient}
            </h2>
          </div>

          <motion.div
            key={recipient}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block"
          >
            <span className="bg-muted text-muted-foreground hover:text-foreground rounded-md px-2 py-1 font-mono text-xs transition-all">
              {fingerprint}
            </span>
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          {recipientPublicKey && featureFlags.enableVerifyQRCode && (
            <div className="md:hidden">
              <VerifyQR
                recipient={recipient}
                recipientPublicKey={recipientPublicKey}
              />
            </div>
          )}

          <Button
            onClick={() => clearMessages(recipient)}
            disabled={getNumberOfMessages(recipient) === 0}
            variant="outline"
            size="sm"
            className="h-8 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear
          </Button>

          <Button
            onClick={onLeave}
            variant="outline"
            size="sm"
            className="h-8 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Leave
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
