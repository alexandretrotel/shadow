interface AccountIdentityProps {
  fingerprint: string | null;
}

export const AccountIdentity = ({ fingerprint }: AccountIdentityProps) => {
  return (
    <div className="flex items-center gap-2">
      {fingerprint && (
        <div className="bg-muted text-muted-foreground hover:text-foreground inline-flex items-center rounded-md px-3 py-1 text-xs transition-all">
          <span className="font-mono tracking-tight">{fingerprint}</span>
        </div>
      )}
    </div>
  );
};
