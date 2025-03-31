import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encode as encodeBase64 } from "@stablelib/base64";
import { PaperclipIcon, XIcon } from "lucide-react";

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
        new Uint8Array(arrayBuffer)
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
      className="flex-shrink-0 p-4 border-t border-muted flex flex-col gap-2"
    >
      {file && (
        <div className="flex items-center gap-2 bg-muted p-2 rounded">
          <span className="text-sm text-foreground truncate">
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
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-accent-foreground"
        >
          <PaperclipIcon className="size-5" />
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <Input
          placeholder="Whisper in the dark..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            sendTyping();
          }}
          className="flex-grow bg-muted text-foreground placeholder-muted-foreground border-none focus:ring-accent"
        />
        <Button
          type="submit"
          className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Send
        </Button>
      </div>
    </form>
  );
};
