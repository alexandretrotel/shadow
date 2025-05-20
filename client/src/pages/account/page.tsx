import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encode } from "@stablelib/base64";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AccountHeader } from "./components/account-header";
import { KeyDisplay } from "./components/key-display";
import { QRCodeDisplay } from "./components/qrcode-display";
import { useAuth } from "@/store/auth.store";
import { getKeyFingerprint } from "@/lib/crypto";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQueue } from "@/store/queue.store";

export const Account = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  const navigate = useNavigate();
  const { keyPair } = useAuth();
  const { isQueueEnabled, setQueueEnabled } = useQueue();

  useEffect(() => {
    if (keyPair) {
      const encodedPublicKey = encode(keyPair.publicKey);
      const encodedPrivateKey = encode(keyPair.secretKey);
      const publicKeyFingerprint = getKeyFingerprint(keyPair.publicKey);

      setPublicKey(encodedPublicKey);
      setPrivateKey(encodedPrivateKey);
      setFingerprint(publicKeyFingerprint);

      const generateQR = async () => {
        const QRCode = await import("qrcode");
        const qrData = JSON.stringify({
          publicKey: encodedPublicKey,
          fingerprint: publicKeyFingerprint,
        });
        const dataUrl = await QRCode.toDataURL(qrData);
        setQrCode(dataUrl);
      };

      generateQR().catch(() => toast.error("Failed to generate QR code."));
    }
  }, [keyPair]);

  const handleCopy = (key: string, type: "public" | "private") => {
    navigator.clipboard.writeText(key);

    if (type === "public") {
      setCopiedPublic(true);
      toast.success("Public key copied to clipboard!");
      setTimeout(() => setCopiedPublic(false), 1500);
    } else {
      setCopiedPrivate(true);
      toast.success("Private key copied to clipboard!");
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
  };

  const handleQueueToggle = (checked: boolean) => {
    setQueueEnabled(checked);
    toast.success(
      checked ? "Message queuing enabled" : "Message queuing disabled",
    );
  };

  if (!keyPair) {
    navigate("/");
    return null;
  }

  return (
    <Card className="w-full max-w-lg border-none shadow-none">
      <CardHeader>
        <AccountHeader fingerprint={fingerprint} />
      </CardHeader>
      <CardContent className="space-y-6">
        <KeyDisplay
          label="Public Key"
          keyValue={publicKey || "Loading..."}
          copied={copiedPublic}
          onCopy={() => publicKey && handleCopy(publicKey, "public")}
        />
        <QRCodeDisplay qrCode={qrCode} />
        <KeyDisplay
          label="Private Key"
          keyValue={privateKey ? "Copy Private Key (Keep Safe!)" : "Loading..."}
          copied={copiedPrivate}
          onCopy={() => privateKey && handleCopy(privateKey, "private")}
          isPrivate
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="queue-toggle"
            checked={isQueueEnabled}
            onCheckedChange={handleQueueToggle}
          />
          <Label htmlFor="queue-toggle">Enable message queuing</Label>
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
