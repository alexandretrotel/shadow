import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { DownloadIcon, EditIcon, TrashIcon } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      const [prefix, content] = message.content.split("]");
      const fileName = prefix.slice(7);
      const fileData = decodeBase64(content);
      const base64Data = encodeBase64(fileData);
      const audioUrl = `data:audio/webm;base64,${base64Data}`;

      return (
        <div className="flex items-center gap-2">
          <audio controls src={audioUrl} className="max-w-[300px]" />
          <a
            href={audioUrl}
            download={fileName}
            className="text-muted-foreground hover:text-accent flex items-center gap-1 text-xs"
          >
            <DownloadIcon className="size-3" /> Download
          </a>
        </div>
      );
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
      className={`mb-3 flex flex-col text-sm ${message.sender === username ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-2 ${message.sender === username ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground"}`}
      >
        <span className="text-muted-foreground font-mono text-xs">
          {message.sender === username ? "You" : message.sender}:
        </span>{" "}
        {isEditing && message.sender === username ? (
          <div className="flex items-center gap-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-muted text-foreground border-none"
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
          <>
            {renderContent()}
            <div className="mt-1 flex items-center gap-2">
              {message.sender === username && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <EditIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(message.messageId)}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-accent-foreground"
                  >
                    😊
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-popover text-popover-foreground flex w-fit gap-2 rounded-md border p-2 shadow-md">
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onReact(message.messageId, "❤️")}
                    className="text-lg"
                  >
                    ❤️
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onReact(message.messageId, "👍")}
                    className="text-lg"
                  >
                    👍
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onReact(message.messageId, "😂")}
                    className="text-lg"
                  >
                    😂
                  </motion.button>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
        {message.timer && (
          <span className="text-muted-foreground ml-2 text-xs">
            ({message.timer}s)
          </span>
        )}
      </div>

      {aggregatedReactions && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`mt-1 flex gap-2 ${message.sender === username ? "justify-end" : "justify-start"}`}
        >
          {Object.entries(aggregatedReactions).map(
            ([reaction, { count, senders }]) => (
              <TooltipProvider key={reaction}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="bg-muted text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-xs">
                      {reaction} {count}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground rounded-md border p-2 shadow-md">
                    {senders.join(", ")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ),
          )}
        </motion.div>
      )}

      <span className="text-muted-foreground mt-1 text-xs">
        {message.status === "sent" && "✓ Sent"}
        {message.status === "delivered" && "✓✓ Delivered"}
        {message.status === "read" && "✓✓ Read"}
        {message.status === "failed" && "✗ Failed"}
      </span>
    </div>
  );
};
