import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { DownloadIcon, MoreHorizontalIcon } from "lucide-react";
import { Message } from "@/types/chat";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion } from "motion/react";
import VoiceMessage from "./voice-message";
import { cn } from "@/lib/utils";

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
  onReact,
}: MessageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);

  const isOwnMessage = message.sender === username;

  const handleEdit = () => {
    onEdit(message.messageId, editContent);
    setIsEditing(false);
  };

  const isImageFile = (fileName: string) =>
    IMAGE_EXTENSIONS.includes(fileName.split(".").pop()?.toLowerCase() || "");

  const renderContent = () => {
    if (message.content.startsWith("[FILE:")) {
      const [prefix, content] = message.content.split("]");
      const fileName = prefix.slice(6);
      const fileData = decodeBase64(content);
      const base64Data = encodeBase64(fileData);
      const dataUrl = `data:application/octet-stream;base64,${base64Data}`;

      if (isImageFile(fileName)) {
        return (
          <div className="flex flex-col gap-1">
            <img
              src={`data:image/${fileName.split(".").pop()};base64,${base64Data}`}
              alt={fileName}
              className="max-w-[300px] rounded-md"
            />
            <a
              href={dataUrl}
              download={fileName}
              className="text-muted-foreground hover:text-accent flex items-center gap-1 text-xs"
            >
              <DownloadIcon className="size-3" /> Download {fileName}
            </a>
          </div>
        );
      }

      return (
        <a
          href={dataUrl}
          download={fileName}
          className="text-accent-foreground hover:text-accent flex items-center gap-1 underline"
        >
          📎 {fileName}
        </a>
      );
    }

    if (message.content.startsWith("[VOICE:")) {
      return <VoiceMessage content={message.content} />;
    }

    return <span className="text-foreground">{message.content}</span>;
  };

  const aggregatedReactions = message.reactions?.reduce(
    (acc, { sender, reaction }) => {
      if (!acc[reaction]) {
        acc[reaction] = { count: 0, senders: [] };
      }
      acc[reaction].count += 1;
      acc[reaction].senders.push(sender);
      return acc;
    },
    {} as Record<string, { count: number; senders: string[] }>,
  );

  return (
    <div
      id={`msg-${message.messageId}`}
      className={cn(
        "mb-3 flex flex-col gap-1 text-sm",
        isOwnMessage ? "items-end" : "items-start",
      )}
    >
      {/* Message Bubble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "max-w-[70%] rounded-lg p-3",
          isOwnMessage
            ? "bg-primary text-secondary-foreground"
            : "bg-card text-foreground",
        )}
      >
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground font-mono text-xs">
            {isOwnMessage ? "You" : message.sender}:
          </span>
          {isEditing && isOwnMessage ? (
            <div className="flex items-center gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-muted text-foreground w-full border-none"
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
            <div>{renderContent()}</div>
          )}
          {message.timer && (
            <span className="text-muted-foreground mt-1 text-xs">
              ({message.timer}s)
            </span>
          )}
        </div>
      </motion.div>

      {/* Reactions and Actions Row */}
      <div
        className={cn(
          "flex items-center gap-2",
          isOwnMessage ? "justify-end" : "justify-start",
        )}
      >
        {/* Status */}
        <span className="text-muted-foreground text-xs">
          {message.status === "sent" && "✓ Sent"}
          {message.status === "delivered" && "✓✓ Delivered"}
          {message.status === "read" && "✓✓ Read"}
          {message.status === "failed" && "✗ Failed"}
        </span>

        {/* Reaction Trigger */}
        <Popover open={reactionsOpen} onOpenChange={setReactionsOpen}>
          <PopoverTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-accent-foreground h-6 w-6"
              >
                😊
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent
            align={isOwnMessage ? "end" : "start"}
            className="bg-popover text-popover-foreground w-fit rounded-md border p-2 shadow-md"
          >
            <div className="flex gap-2">
              {["❤️", "👍", "😂", "😮", "😢"].map((reaction) => (
                <motion.button
                  key={reaction}
                  whileHover={{ scale: 1.3, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onReact(message.messageId, reaction);
                    setReactionsOpen(false);
                  }}
                  className="text-lg"
                >
                  {reaction}
                </motion.button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Options Trigger (for own messages only) */}
        {isOwnMessage && !isEditing && (
          <Popover open={optionsOpen} onOpenChange={setOptionsOpen}>
            <PopoverTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-accent-foreground h-6 w-6"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="bg-popover text-popover-foreground w-fit rounded-md border p-2 shadow-md"
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(true);
                    setOptionsOpen(false);
                  }}
                  className="justify-start"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDelete(message.messageId);
                    setOptionsOpen(false);
                  }}
                  className="text-destructive hover:text-destructive justify-start"
                >
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Reactions Display */}
      {aggregatedReactions && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mt-1 flex flex-wrap gap-1",
            isOwnMessage ? "justify-end" : "justify-start",
          )}
        >
          {Object.entries(aggregatedReactions).map(([reaction, { count }]) => (
            <motion.span
              key={reaction}
              whileHover={{ scale: 1.1 }}
              className="bg-muted text-foreground flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs"
              onClick={() => onReact(message.messageId, reaction)}
            >
              {reaction} {count}
            </motion.span>
          ))}
        </motion.div>
      )}
    </div>
  );
};
