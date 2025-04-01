import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const AccountPage = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true);

  const navigate = useNavigate();
  const { username, getKeyPair } = useAuth();

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error("Password is required!");
      return;
    }

    try {
      const keyPair = await getKeyPair(password);

      if (!keyPair) {
        toast.error("Failed to retrieve key pair. Please log in again.");
        navigate("/");
        return;
      }

      const encodedPublicKey = encode(keyPair.publicKey || new Uint8Array());
      const encodedPrivateKey = encode(keyPair.secretKey || new Uint8Array());

      setPublicKey(encodedPublicKey);
      setPrivateKey(encodedPrivateKey);

      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(encodedPublicKey);
      setQrCode(dataUrl);

      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error("Error retrieving keys:", error);
      toast.error("An error occurred while retrieving keys.");
      navigate("/");
    }
  };

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
    <>
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
            <Button onClick={handlePasswordSubmit} className="w-full py-3">
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            keyValue={
              privateKey ? "Copy Private Key (Keep Safe!)" : "Loading..."
            }
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
    </>
  );
};

export default AccountPage;
