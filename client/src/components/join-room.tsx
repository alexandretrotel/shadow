import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JoinRoomProps {
  onJoin: (roomName: string, password: string, username: string) => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName && password && username) {
      onJoin(roomName, password, username);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-10 shadow-lg border-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg text-secondary-foreground tracking-wide">
          Enter the Shadows
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="bg-muted text-foreground placeholder-muted-foreground border-none focus:ring-accent"
          />
          <Input
            type="password"
            placeholder="Secret Key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-muted text-foreground placeholder-muted-foreground border-none focus:ring-accent"
          />
          <Input
            placeholder="Alias"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-muted text-foreground placeholder-muted-foreground border-none focus:ring-accent"
          />
          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Join
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
