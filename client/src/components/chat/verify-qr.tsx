import { getKeyFingerprint } from "@/lib/crypto";
import { decode } from "@stablelib/base64";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { BrowserQRCodeReader } from "@zxing/browser";
import { useIsMobile } from "@/hooks/use-mobile";

interface VerifyQRProps {
  recipient: string;
  recipientPublicKey: string;
}

export const VerifyQR = ({ recipient, recipientPublicKey }: VerifyQRProps) => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef(new BrowserQRCodeReader());

  const isMobile = useIsMobile();

  const startScan = useCallback(async () => {
    try {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      videoElement.srcObject = stream;
      videoElement.play();

      codeReader.current.decodeFromVideoElement(videoElement, (result, err) => {
        if (result) {
          setQrData(result.getText());
          stopScan();
        }

        if (err) {
          throw err;
        }
      });
    } catch {
      toast.error("Unable to access camera");
    }
  }, []);

  const stopScan = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startScan();
    }

    return () => stopScan();
  }, [isOpen, startScan]);

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
            <video ref={videoRef} className="w-full rounded-lg border" />
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
