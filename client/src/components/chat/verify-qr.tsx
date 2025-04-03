import { getKeyFingerprint } from "@/lib/crypto";
import { decode } from "@stablelib/base64";
import { useState } from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { QrReader } from "react-qr-reader";
import { useIsMobile } from "@/hooks/use-mobile";

interface VerifyQRProps {
  recipient: string;
  recipientPublicKey: string;
}

export const VerifyQR = ({ recipient, recipientPublicKey }: VerifyQRProps) => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isMobile = useIsMobile();

  const handleScan = (data: string | null) => {
    if (data) {
      setQrData(data);
    }
  };

  const handleVerify = () => {
    if (!qrData) {
      toast.error("Please scan a QR code first");
      return;
    }

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
        setIsOpen(false);
      }
    } catch {
      toast.error("Invalid QR data format");
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Verify
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Verify {recipient}'s Public Key</DrawerTitle>
          <DrawerDescription>
            Scan the QR code to verify the recipient's identity
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6">
          <div className="mx-auto max-w-[300px]">
            <QrReader
              onResult={(result: unknown) => {
                if (result && typeof result === "object") {
                  const { result: resultData } = result as {
                    result: { text: string };
                  };

                  handleScan(resultData.text);
                }
              }}
              constraints={{ facingMode: "environment" }}
              className="w-full rounded-lg border border-gray-200"
            />
          </div>

          {qrData && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Scanned data detected</p>
            </div>
          )}
        </div>

        <DrawerFooter className="grid grid-cols-2 gap-4 md:mx-auto">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>

          <Button onClick={handleVerify} disabled={!qrData}>
            Verify QR Code
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
