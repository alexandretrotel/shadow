import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { DownloadIcon } from "lucide-react";
import { motion } from "framer-motion";
import VoiceMessage from "./voice-message";
import { cn } from "@/lib/utils";
import { featureFlags } from "@/lib/features";
import { Message } from "@shared/src/types";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export const MessageItem = ({ message, isOwnMessage }: MessageItemProps) => {
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
              </div>
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
