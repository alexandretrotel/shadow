import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encode as encodeBase64 } from "@stablelib/base64";
import { PaperclipIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";

interface InputAreaProps {
  onSend: (content: string, timer?: number) => void;
  sendTyping: () => void;
}

export const InputArea = ({ onSend, sendTyping }: InputAreaProps) => {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input && !file) return;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const content = `[FILE:${file.name}]${encodeBase64(
        new Uint8Array(arrayBuffer),
      )}`;
      onSend(content);
      setFile(null);
    } else if (input) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="border-muted flex flex-shrink-0 flex-col gap-2 border-t p-4"
    >
      {file && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-muted flex items-center gap-2 rounded p-2"
        >
          <span className="text-foreground truncate text-sm">
            📎 {file.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFile(null)}
            className="p-1"
          >
            <XIcon className="size-4" />
          </Button>
        </motion.div>
      )}
      <div className="flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-accent-foreground"
          >
            <PaperclipIcon className="size-5" />
          </Button>
        </motion.div>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <motion.div
          whileFocus={{ scale: 1.02, borderColor: "var(--ring)" }}
          transition={{ duration: 0.2 }}
          className="flex-grow"
        >
          <Input
            placeholder="Whisper in the dark..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              sendTyping();
            }}
            className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent flex-grow border-none"
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
          <Button
            type="submit"
            className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Send
          </Button>
        </motion.div>
      </div>
    </form>
  );
};
