import { Check, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KeyDisplayProps {
  label: string;
  keyValue: string;
  copied: boolean;
  onCopy: () => void;
  isPrivate?: boolean;
}

export const KeyDisplay = ({
  label,
  keyValue,
  copied,
  onCopy,
  isPrivate,
}: KeyDisplayProps) => (
  <div>
    <p className="text-muted-foreground mb-2 text-sm">{label}</p>
    <Button
      variant="outline"
      className={cn(
        "w-full justify-start truncate py-3",
        copied ? "opacity-50" : "opacity-100",
      )}
      onClick={onCopy}
    >
      {copied ? (
        <Check className="mr-2 h-5 w-5" />
      ) : (
        <Clipboard className="mr-2 h-5 w-5" />
      )}
      {copied ? "Copied!" : keyValue}
    </Button>
    {isPrivate && (
      <p className="text-destructive mt-2 text-xs">
        Warning: Never share your private key!
      </p>
    )}
  </div>
);
