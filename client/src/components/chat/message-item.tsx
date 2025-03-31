import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import { DownloadIcon } from "lucide-react";
import { Message } from "@/types/chat";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

interface MessageItemProps {
  message: Message;
  username: string;
}

export const MessageItem = ({ message, username }: MessageItemProps) => {
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
              className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1"
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
          className="text-accent-foreground underline hover:text-accent flex items-center gap-1"
        >
          📎 {fileName}
        </a>
      );
    }
    return <span className="text-foreground">{message.content}</span>;
  };

  return (
    <div
      className={`mb-3 text-sm flex flex-col ${
        message.sender === username ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`max-w-[70%] p-2 rounded-lg ${
          message.sender === username
            ? "bg-secondary text-secondary-foreground"
            : "bg-card text-foreground"
        }`}
      >
        <span className="font-mono text-xs text-muted-foreground">
          {message.sender === username ? "You" : message.sender}:
        </span>{" "}
        {renderContent()}
        {message.timer && (
          <span className="text-xs text-muted-foreground ml-2">
            ({message.timer}s)
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground mt-1">
        {message.status}
      </span>
    </div>
  );
};
