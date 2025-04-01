import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { SERVER_URL } from "@/lib/server";
import { useChat } from "@/store/chat.store";
import { getKeyFingerprint } from "@/lib/crypto";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { publicKeySchema } from "@/lib/schemas";
import { decode } from "@stablelib/base64";

interface ChatHeaderProps {
  recipient: string;
  onLeave: () => void;
}

export const ChatHeader = ({ recipient, onLeave }: ChatHeaderProps) => {
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(
    null,
  );

  const { clearMessages } = useChat();

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
        <div className="flex items-center gap-4">
          <CardTitle className="text-secondary-foreground text-lg tracking-wide">
            {recipient}
          </CardTitle>

          <motion.span
            key={recipient}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-muted text-muted-foreground hover:text-foreground rounded border px-2 py-1 font-mono text-xs"
          >
            <span className="blur-xs transition-all duration-400 hover:blur-none">
              {getKeyFingerprint(decode(recipientPublicKey || ""))}
            </span>
          </motion.span>
        </div>
        <motion.div transition={{ duration: 0.2 }} className="flex gap-2">
          <Button
            onClick={() => clearMessages(recipient)}
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
    </CardHeader>
  );
};
