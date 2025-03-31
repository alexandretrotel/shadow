import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import { Message } from "@/types/chat";
import { motion } from "motion/react";

interface MessageSearchProps {
  messages: Message[];
  onSelect: (messageId: string) => void;
}

export const MessageSearch = ({ messages, onSelect }: MessageSearchProps) => {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(messages, {
        keys: ["content", "sender"],
        threshold: 0.3,
      }),
    [messages],
  );

  const results = query ? fuse.search(query).map((result) => result.item) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-2"
    >
      <Input
        placeholder="Search messages..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
      />
      {results.length > 0 && (
        <motion.ul
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          transition={{ duration: 0.2 }}
          className="mt-2 max-h-40 overflow-y-auto"
        >
          {results.map((msg) => (
            <li
              key={msg.messageId}
              onClick={() => {
                onSelect(msg.messageId);
                setQuery("");
              }}
              className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer rounded p-2"
            >
              <span className="text-muted-foreground">{msg.sender}:</span>{" "}
              {msg.content.slice(0, 50)}...
            </li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
};
