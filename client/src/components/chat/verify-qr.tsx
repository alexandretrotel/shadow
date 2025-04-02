// TODO: Add a libary to decode QR codes instead of typing
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getKeyFingerprint } from "@/lib/crypto";
import { decode } from "@stablelib/base64";

interface VerifyQRProps {
  recipient: string;
  recipientPublicKey: string;
}

export const VerifyQR = ({ recipient, recipientPublicKey }: VerifyQRProps) => {
  const [qrData, setQrData] = useState("");

  const handleVerify = () => {
    try {
      const data = JSON.parse(qrData) as {
        username: string;
        fingerprint: string;
      };
      const decodedPublicKey = decode(recipientPublicKey);
      const calculatedFingerprint = getKeyFingerprint(decodedPublicKey);

      if (data.username !== recipient) {
        toast.error("Username does not match recipient!");
        return;
      }

      if (data.fingerprint !== calculatedFingerprint) {
        toast.error("Public key fingerprint does not match!");
      } else {
        toast.success("Public key verified successfully!");
      }
    } catch {
      toast.error("Invalid QR data format");
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <Input
        placeholder="Paste QR code data here"
        value={qrData}
        onChange={(e) => setQrData(e.target.value)}
      />
      <Button onClick={handleVerify}>Verify QR Code</Button>
    </div>
  );
};
