import { socketService } from "@/lib/socket-service";
import { useChatStore } from "@/store/chat-store";
import { useEffect, useState } from "react";
import { encode as encodeBase64 } from "@stablelib/base64";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Account = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);

  const { username } = useChatStore();
  const keyPair = socketService.getKeyPair();

  useEffect(() => {
    if (!keyPair) return;

    const generateQRCode = async () => {
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(encodeBase64(keyPair.publicKey));
        setQrCode(dataUrl);
      } catch (error) {
        console.error("QR Code generation failed:", error);
      }
    };

    generateQRCode();
  }, [keyPair]);

  return (
    <Card>
      <CardContent>
        <h2>{username}</h2>
        <p>
          Public Key: {encodeBase64(keyPair?.publicKey || new Uint8Array())}
        </p>

        {qrCode ? (
          <img src={qrCode} alt="Public Key QR" />
        ) : (
          <p>Generating QR Code...</p>
        )}

        <Button
          onClick={() =>
            navigator.clipboard.writeText(
              encodeBase64(keyPair?.secretKey || new Uint8Array()),
            )
          }
        >
          Copy Private Key (Keep Safe!)
        </Button>
      </CardContent>
    </Card>
  );
};

export default Account;
