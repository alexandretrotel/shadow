interface AccountIdentityProps {
  username: string;
  fingerprint: string | null;
}

export const AccountIdentity = ({
  username,
  fingerprint,
}: AccountIdentityProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-primary text-xl leading-tight font-semibold">
          @{username}
        </span>
      </div>

      {fingerprint && (
        <div className="bg-muted text-muted-foreground hover:text-foreground inline-flex items-center rounded-full px-3 py-1 text-sm transition-all">
          <span className="font-mono tracking-tight">{fingerprint}</span>
        </div>
      )}
    </div>
  );
};
