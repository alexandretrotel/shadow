interface QRCodeDisplayProps {
  qrCode: string | null;
}

export const QRCodeDisplay = ({ qrCode }: QRCodeDisplayProps) => {
  if (!qrCode) return null;

  return (
    <div className="flex justify-center">
      <img
        src={qrCode}
        alt="Public Key QR"
        className="mt-4 max-w-[220px] rounded-md border shadow-md"
      />
    </div>
  );
};
