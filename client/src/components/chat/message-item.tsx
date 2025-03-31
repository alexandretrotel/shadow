import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { DownloadIcon } from "lucide-react";
import { Message } from "@/types/chat";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import VoiceMessage from "./voice-message";
import { cn } from "@/lib/utils";
import { featureFlags, isFeatureEnabled } from "@/lib/features";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

interface MessageItemProps {
  message: Message;
  username: string;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, reaction: string) => void;
}

export const MessageItem = ({
  message,
  username,
  onEdit,
}: MessageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwnMessage = message.sender === username;

  const handleEdit = () => {
    if (isFeatureEnabled("enableEditDelete")) {
      onEdit(message.messageId, editContent);
      setIsEditing(false);
    }
  };

  const isImageFile = (fileName: string) =>
    IMAGE_EXTENSIONS.includes(fileName.split(".").pop()?.toLowerCase() || "");

  const renderImageContent = () => {
    if (message.content.startsWith("[FILE:")) {
      const [prefix, content] = message.content.split("]");
      const fileName = prefix.slice(6);
      const fileData = decodeBase64(content);
      const base64Data = encodeBase64(fileData);
      const dataUrl = `data:application/octet-stream;base64,${base64Data}`;

      if (isImageFile(fileName)) {
        return (
          <div className="flex flex-col gap-2">
            <img
              src={`data:image/${fileName.split(".").pop()};base64,${base64Data}`}
              alt={fileName}
              className="max-w-[300px] rounded-lg shadow-md"
            />
            {featureFlags.enableImageDownload && (
              <a
                href={dataUrl}
                download={fileName}
                className="text-muted-foreground hover:text-primary-foreground flex items-center gap-1 text-xs"
              >
                <DownloadIcon className="mr-1 size-3" /> {fileName}
              </a>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const renderVoiceContent = () => {
    if (message.content.startsWith("[VOICE:")) {
      return <VoiceMessage content={message.content} />;
    }
    return null;
  };

  const renderTextContent = () => {
    if (
      !message.content.startsWith("[FILE:") &&
      !message.content.startsWith("[VOICE:")
    ) {
      return (
        <span className="text-foreground leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </span>
      );
    }
    if (message.content.startsWith("[FILE:")) {
      const [prefix, content] = message.content.split("]");
      const fileName = prefix.slice(6);
      const fileData = decodeBase64(content);
      const base64Data = encodeBase64(fileData);
      const dataUrl = `data:application/octet-stream;base64,${base64Data}`;

      if (!isImageFile(fileName)) {
        return (
          <a
            href={dataUrl}
            download={fileName}
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            📎 {fileName}
          </a>
        );
      }
    }
    return null;
  };

  const imageContent = renderImageContent();
  const voiceContent = renderVoiceContent();
  const textContent = renderTextContent();

  return (
    <motion.div
      id={`msg-${message.messageId}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "mb-4 flex flex-col gap-1",
        isOwnMessage ? "items-end" : "items-start",
      )}
    >
      {imageContent && (
        <div
          className={cn("max-w-[80%]", isOwnMessage ? "ml-auto" : "mr-auto")}
        >
          {imageContent}
        </div>
      )}
      {voiceContent && (
        <div
          className={cn("max-w-[80%]", isOwnMessage ? "ml-auto" : "mr-auto")}
        >
          {voiceContent}
        </div>
      )}
      {textContent && (
        <div
          className={cn(
            "max-w-[80%] rounded-xl p-4 shadow-md transition-all duration-200",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground border-border border",
          )}
        >
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs opacity-80">
              {!isOwnMessage && message.sender}
            </span>
            {isFeatureEnabled("enableEditDelete") &&
            isEditing &&
            isOwnMessage ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-background text-foreground border-border w-full"
                />
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div>{textContent}</div>
            )}
            {message.timer && (
              <span className="text-muted-foreground mt-1 text-xs opacity-70">
                Self-destructs in {message.timer}s
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          "mt-1 flex items-center gap-2",
          isOwnMessage ? "justify-end" : "justify-start",
        )}
      >
        <span className="text-muted-foreground text-xs opacity-70">
          {message.status === "sent" && "✓ Sent"}
          {message.status === "delivered" && "✓✓ Delivered"}
          {message.status === "read" && "✓✓ Read"}
          {message.status === "failed" && "✗ Failed"}
        </span>
      </div>
    </motion.div>
  );
};
