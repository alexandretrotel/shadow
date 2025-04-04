import { AccountIdentity } from "./account-identity";

interface AccountHeaderProps {
  fingerprint: string | null;
}

export const AccountHeader = ({ fingerprint }: AccountHeaderProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-secondary-foreground text-2xl font-semibold tracking-wide">
        Account Details
      </h2>
      <AccountIdentity fingerprint={fingerprint} />
    </div>

    <p className="text-muted-foreground text-sm">Manage your Shadow account</p>
  </div>
);
