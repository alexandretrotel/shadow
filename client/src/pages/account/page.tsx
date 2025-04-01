import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encode as encodeBase64 } from "@stablelib/base64";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AccountHeader } from "./components/account-header";
import { AccountIdentity } from "./components/account-idendity";
import { KeyDisplay } from "./components/key-display";
import { QRCodeDisplay } from "./components/qrcode-display";

const AccountPage = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);

  const navigate = useNavigate();

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

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader>
        <AccountHeader />
      </CardHeader>

      <CardContent className="space-y-6">
        <AccountIdentity username={username} />
        <KeyDisplay
          label="Public Key"
          keyValue={publicKeyBase64}
          copied={copiedPublic}
          onCopy={() => handleCopy(publicKeyBase64, "public")}
        />
        <QRCodeDisplay qrCode={qrCode} />
        <KeyDisplay
          label="Private Key"
          keyValue="Copy Private Key (Keep Safe!)"
          copied={copiedPrivate}
          onCopy={() => handleCopy(privateKeyBase64, "private")}
          isPrivate
        />
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

export default AccountPage;
