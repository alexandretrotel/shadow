import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encode as encodeBase64 } from "@stablelib/base64";
import { Check, Clipboard } from "lucide-react";
import { socketService } from "@/lib/socket-service";
import { useChatStore } from "@/store/chat-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Account = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const navigate = useNavigate();
  const { username } = useChatStore();
  const keyPair = socketService.getKeyPair();

  const publicKeyBase64 = encodeBase64(keyPair?.publicKey || new Uint8Array());
  const privateKeyBase64 = encodeBase64(keyPair?.secretKey || new Uint8Array());

  useEffect(() => {
    if (!keyPair) return;

    const generateQRCode = async () => {
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(publicKeyBase64);
        setQrCode(dataUrl);
      } catch (error) {
        console.error("QR Code generation failed:", error);
      }
    };

    generateQRCode();
  }, [keyPair, publicKeyBase64]);

  const handleCopyPublic = () => {
    navigator.clipboard.writeText(publicKeyBase64);
    setCopiedPublic(true);
    toast.success("Public key copied to clipboard!");
    setTimeout(() => setCopiedPublic(false), 1500);
  };

  const handleCopyPrivate = () => {
    navigator.clipboard.writeText(privateKeyBase64);
    setCopiedPrivate(true);
    toast.success("Private key copied to clipboard!");
    setTimeout(() => setCopiedPrivate(false), 2000);
  };

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-secondary-foreground text-lg tracking-wide">
          Account Details
        </CardTitle>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Home
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">@{username}</h2>

          <div
            className={cn(
              "bg-muted hover:bg-secondary group relative flex w-full cursor-pointer items-center justify-center rounded-md border p-2 text-sm transition",
              copiedPublic ? "bg-green-500 text-white hover:bg-green-500" : "",
            )}
            onClick={handleCopyPublic}
          >
            <span className="truncate blur-md transition-all duration-200 group-hover:blur-none">
              {publicKeyBase64}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {qrCode ? (
            <img
              src={qrCode}
              alt="Public Key QR"
              className="rounded-md border shadow-sm"
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Generating QR Code...
            </p>
          )}
        </div>

        <Button
          className={cn(
            "bg-secondary text-secondary-foreground flex w-full items-center justify-center gap-2 transition-all",
            copiedPrivate ? "bg-green-500 hover:bg-green-500" : "",
          )}
          onClick={handleCopyPrivate}
        >
          {copiedPrivate ? (
            <Check className="h-5 w-5" />
          ) : (
            <Clipboard className="h-5 w-5" />
          )}
          {copiedPrivate ? "Copied!" : "Copy Private Key (Keep Safe!)"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Account;
