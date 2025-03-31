import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encode as encodeBase64 } from "@stablelib/base64";
import { PaperclipIcon, XIcon, MicIcon } from "lucide-react";
import { motion } from "motion/react";

interface InputAreaProps {
  onSend: (content: string, timer?: number) => void;
  sendTyping: () => void;
}

export const InputArea = ({ onSend, sendTyping }: InputAreaProps) => {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const content = `[VOICE:${Date.now()}.webm]${encodeBase64(new Uint8Array(arrayBuffer))}`;
      onSend(content);
      stream.getTracks().forEach((track) => track.stop());
      setRecordingDuration(0);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

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
        <motion.div
          transition={isRecording ? { repeat: Infinity, duration: 0.8 } : {}}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className={`text-muted-foreground hover:text-accent-foreground ${isRecording ? "bg-accent/20" : ""}`}
          >
            {isRecording ? (
              <span className="text-xs">{recordingDuration}s</span>
            ) : (
              <MicIcon className="size-5" />
            )}
          </Button>
        </motion.div>
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
