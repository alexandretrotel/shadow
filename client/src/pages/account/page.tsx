import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encode } from "@stablelib/base64";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AccountHeader } from "./components/account-header";
import { AccountIdentity } from "./components/account-idendity";
import { KeyDisplay } from "./components/key-display";
import { QRCodeDisplay } from "./components/qrcode-display";
import { useAuth } from "@/store/auth.store";

export const Account = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);

  const navigate = useNavigate();
  const { username, keyPair } = useAuth();

  const publicKey = keyPair ? encode(keyPair.publicKey) : null;
  const privateKey = keyPair ? encode(keyPair.secretKey) : null;

  console.log("keyPair", encode(keyPair?.publicKey ?? Uint8Array.from([])));

  useEffect(() => {
    const handleQRCode = async (publicKey: string) => {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(publicKey);
      setQrCode(dataUrl);
    };

    if (publicKey) {
      handleQRCode(publicKey);
    }
  }, [publicKey, navigate]);

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

  if (!username) {
    toast.error("Please log in to view your account.");
    navigate("/");
    return null;
  }

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader>
        <AccountHeader />
      </CardHeader>

      <CardContent className="space-y-6">
        <AccountIdentity username={username} />
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
