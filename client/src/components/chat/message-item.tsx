import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { DownloadIcon, Edit2Icon, XIcon } from "lucide-react";
import { Message } from "@/types/chat";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
  onDelete,
}: MessageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

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
          <motion.div whileHover={{ scale: 1.02 }} className="group relative">
            <img
              src={`data:image/${fileName.split(".").pop()};base64,${base64Data}`}
              alt={fileName}
              className="max-w-[300px] rounded-lg shadow-md transition-all duration-200"
            />
            {featureFlags.enableImageDownload && (
              <a
                href={dataUrl}
                download={fileName}
                className="bg-background/80 absolute right-2 bottom-2 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <DownloadIcon className="text-muted-foreground size-4" />
              </a>
            )}
          </motion.div>
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
          <motion.a
            href={dataUrl}
            download={fileName}
            whileHover={{ x: 2 }}
            className="text-primary bg-background/50 hover:bg-background/80 flex items-center gap-2 rounded-md px-3 py-1 text-sm transition-colors"
          >
            <DownloadIcon className="size-4" />
            <span>{fileName}</span>
          </motion.a>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "mb-4 flex flex-col gap-2",
        isOwnMessage ? "items-end" : "items-start",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(imageContent || voiceContent || textContent) && (
        <div
          className={cn(
            "max-w-[80%]",
            isOwnMessage ? "ml-auto" : "mr-auto",
            voiceContent && "w-full max-w-[400px]",
          )}
        >
          {imageContent}
          {voiceContent}
          {textContent && (
            <motion.div
              className={cn(
                "relative rounded-xl p-2 px-4 shadow-md transition-all duration-200",
                isOwnMessage
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border-border border",
              )}
              whileHover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex flex-col gap-2">
                {!isOwnMessage && (
                  <span className="text-muted-foreground text-sm font-medium">
                    {message.sender}
                  </span>
                )}
                <AnimatePresence mode="wait">
                  {isEditing && isOwnMessage ? (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="bg-background text-foreground border-border w-full"
                      />
                      <Button size="sm" onClick={handleEdit}>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {textContent}
                    </motion.div>
                  )}
                </AnimatePresence>
                {message.timer && (
                  <span className="text-muted-foreground mt-1 text-xs opacity-70">
                    Self-destructs in {message.timer}s
                  </span>
                )}
              </div>

              {isFeatureEnabled("enableEditDelete") && isOwnMessage && (
                <AnimatePresence>
                  {isHovered && !isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-2 right-2 flex gap-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-background/80 h-6 w-6 p-0"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2Icon className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-background/80 h-6 w-6 p-0"
                        onClick={() => onDelete(message.messageId)}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          <motion.div
            className={cn(
              "mt-1 flex items-center gap-2 text-xs",
              isOwnMessage ? "justify-end" : "justify-start",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
          >
            <span
              className={cn(
                "font-mono",
                message.status === "failed" && "text-destructive",
                message.status === "read" && "text-blue-500",
              )}
            >
              {message.status === "sent" && "✓ Sent"}
              {message.status === "delivered" && "✓✓ Delivered"}
              {message.status === "read" && "✓✓ Read"}
              {message.status === "failed" && "✗ Failed"}
            </span>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
