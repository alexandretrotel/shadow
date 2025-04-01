import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encode as encodeBase64 } from "@stablelib/base64";
import { Check, Clipboard } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getKeyPair } from "@/lib/storage";

const Account = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const navigate = useNavigate();
  const { username } = useChatStore();
  const keyPair = getKeyPair();

  const publicKeyBase64 = encodeBase64(keyPair?.publicKey || new Uint8Array());
  const privateKeyBase64 = encodeBase64(keyPair?.secretKey || new Uint8Array());

  useEffect(() => {
    if (!keyPair) return;
    const generateQRCode = async () => {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(publicKeyBase64);
      setQrCode(dataUrl);
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
      <CardHeader>
        <CardTitle className="text-secondary-foreground text-2xl font-semibold tracking-wide">
          Account Details
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Manage your Shadow account
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <h2 className="text-primary text-xl font-semibold">@{username}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Your Shadow identity
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Public Key</p>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start truncate py-3",
                copiedPublic ? "opacity-50" : "opacity-100",
              )}
              onClick={handleCopyPublic}
            >
              {copiedPublic ? (
                <Check className="mr-2 h-5 w-5" />
              ) : (
                <Clipboard className="mr-2 h-5 w-5" />
              )}
              {publicKeyBase64}
            </Button>
          </div>
          {qrCode && (
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="Public Key QR"
                className="mt-4 max-w-[220px] rounded-md border shadow-md"
              />
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Private Key</p>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start py-3",
                copiedPrivate ? "opacity-50" : "opacity-100",
              )}
              onClick={handleCopyPrivate}
            >
              {copiedPrivate ? (
                <Check className="mr-2 h-5 w-5" />
              ) : (
                <Clipboard className="mr-2 h-5 w-5" />
              )}
              {copiedPrivate ? "Copied!" : "Copy Private Key (Keep Safe!)"}
            </Button>
            <p className="text-destructive mt-2 text-xs">
              Warning: Never share your private key!
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-6 w-full py-3"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </CardContent>
    </Card>
  );
};

export default Account;
