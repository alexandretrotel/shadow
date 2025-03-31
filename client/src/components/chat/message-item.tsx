import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { DownloadIcon } from "lucide-react";
import { Message } from "@/types/chat";
import { useState } from "react";
import { EditIcon, TrashIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

interface MessageItemProps {
  message: Message;
  username: string;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

export const MessageItem = ({
  message,
  username,
  onEdit,
  onDelete,
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
              src={`data:image/${fileName
                .split(".")
                .pop()};base64,${base64Data}`}
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
            {message.sender === username && (
              <div className="mt-1 flex gap-1">
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
              </div>
            )}
          </>
        )}
        {message.timer && (
          <span className="text-muted-foreground ml-2 text-xs">
            ({message.timer}s)
          </span>
        )}
      </div>
      <span className="text-muted-foreground mt-1 text-xs">
        {message.status === "sent" && "✓ Sent"}
        {message.status === "delivered" && "✓✓ Delivered"}
        {message.status === "read" && "✓✓ Read"}
        {message.status === "failed" && "✗ Failed"}
      </span>
    </div>
  );
};
