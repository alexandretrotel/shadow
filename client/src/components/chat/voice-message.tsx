import { useEffect, useRef, useState } from "react";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface VoiceMessageProps {
  content: string;
  className?: string;
}

const VoiceMessage = ({ content, className }: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [, encodedData] = content.split("]");
  const fileData = decodeBase64(encodedData);
  const base64Data = encodeBase64(fileData);
  const audioUrl = `data:audio/webm;base64,${base64Data}`;

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    const audio = audioRef.current;

    const duration = isNaN(audio.duration) ? undefined : audio.duration;

    const setMetadata = () => setDuration(duration);
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", setMetadata);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", setMetadata);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .catch((err) => console.error("Playback error:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration!;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <motion.div
      className={cn(
        "flex w-full max-w-md items-center gap-2 rounded-lg p-2",
        className,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className="text-muted-foreground hover:text-accent-foreground"
        >
          {isPlaying ? (
            <PauseIcon className="size-5" />
          ) : (
            <PlayIcon className="size-5" />
          )}
        </Button>
      </motion.div>

      <div
        className="relative h-3 flex-grow cursor-pointer overflow-hidden rounded-full"
        onClick={handleSeek}
        role="progressbar"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        title={`Click to seek. Current time: ${formatTime(
          currentTime,
        )}, Duration: ${formatTime(duration!)}`}
      >
        <motion.div
          className="bg-accent h-full rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentTime / duration!) * 100 || 0}%` }}
          transition={{ ease: "linear" }}
        />

        {isPlaying && (
          <motion.div
            className="absolute inset-0 flex gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-accent/50 w-1 rounded-full"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </motion.div>
        )}
      </div>

      <span className="text-muted-foreground font-mono text-xs tabular-nums">
        {!duration
          ? `${formatTime(currentTime)}`
          : `${formatTime(currentTime)} / ${formatTime(duration)}`}
      </span>
    </motion.div>
  );
};

export default VoiceMessage;
