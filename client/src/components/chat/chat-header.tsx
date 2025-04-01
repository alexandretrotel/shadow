import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { SERVER_URL } from "@/lib/server";
import { useChat } from "@/store/chat.store";
import { getKeyFingerprint } from "../../../../common/src/crypto";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { publicKeySchema } from "../../../../common/src/schemas";
import { decode } from "@stablelib/base64";

interface ChatHeaderProps {
  recipient: string;
  onLeave: () => void;
}

export const ChatHeader = ({ recipient, onLeave }: ChatHeaderProps) => {
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchRecipientPublicKey = async () => {
      const response = await fetch(`${SERVER_URL}/public-key/${recipient}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        toast.error(
          `Failed to fetch public key for ${recipient}. Please try again.`,
        );
        return;
      }

      const data = await response.json();
      const { publicKey } = publicKeySchema.parse(data);

      setRecipientPublicKey(publicKey);
    };

    fetchRecipientPublicKey();
  }, [recipient]);

  return (
    <CardHeader className="border-muted flex-shrink-0 border-b pt-6">
      <div className="flex items-center justify-between">
        <CardTitle className="text-secondary-foreground text-lg tracking-wide">
          @{recipient}
        </CardTitle>
        <motion.div transition={{ duration: 0.2 }} className="flex gap-2">
          <Button
            onClick={() => useChat.getState().clearMessages(recipient)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            Clear Chat
          </Button>

          <Button
            onClick={onLeave}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            Leave
          </Button>
        </motion.div>
      </div>

      {recipientPublicKey && (
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
          <motion.span
            key={recipient}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-muted rounded px-2 py-1"
          >
            {recipient} ({getKeyFingerprint(decode(recipientPublicKey || ""))})
          </motion.span>
        </div>
      )}
    </CardHeader>
  );
};
