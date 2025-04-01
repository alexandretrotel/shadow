interface AccountIdentityProps {
  username: string;
}

export const AccountIdentity = ({ username }: AccountIdentityProps) => (
  <div className="text-center">
    <h2 className="text-primary text-xl font-semibold">@{username}</h2>
    <p className="text-muted-foreground mt-1 text-sm">Your Shadow identity</p>
  </div>
);
