import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { useChatStore } from "@/store/chat-store";
import { motion } from "motion/react";

interface ParticipantsProps {
  username: string;
  onLeave: () => void;
}

export const ChatHeader = ({ username, onLeave }: ParticipantsProps) => (
  <CardHeader className="border-muted flex-shrink-0 border-b pt-6">
    <div className="flex items-center justify-between">
      <CardTitle className="text-secondary-foreground text-lg tracking-wide">
        @{username}
      </CardTitle>
      <motion.div transition={{ duration: 0.2 }} className="flex gap-2">
        <Button
          onClick={() => useChatStore.getState().clearMessages()}
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

    <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
      <motion.span
        key={username}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-muted rounded px-2 py-1"
      >
        {username} ({getPublicKeyFingerprint(username)})
      </motion.span>
    </div>
  </CardHeader>
);
