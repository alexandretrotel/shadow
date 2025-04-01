import { useState, useRef, useEffect } from "react";
import { decode } from "@stablelib/base64";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VoiceMessageProps {
  content: string;
}

const VoiceMessage = ({ content }: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const [, data] = content.split("]");
    const audioData = decode(data);
    const blob = new Blob([audioData], { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    audioRef.current = new Audio(url);

    const audio = audioRef.current;
    audio.addEventListener("timeupdate", () => {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      setProgress(progressPercent);
    });
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
    };
  }, [content]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-card flex items-center gap-3 rounded-lg p-2 pr-4 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="text-foreground"
      >
        {isPlaying ? (
          <PauseIcon className="size-5" />
        ) : (
          <PlayIcon className="size-5" />
        )}
      </Button>
      <Progress value={progress} className="bg-background h-2 flex-grow" />
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {audioRef.current?.duration
          ? `${Math.round(audioRef.current.currentTime)} / ${Math.round(audioRef.current.duration)}s`
          : "Loading..."}
      </span>
    </div>
  );
};

export default VoiceMessage;
