import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="mx-auto mt-10 max-w-md border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-secondary-foreground text-lg tracking-wide">
            Enter the Shadows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
            />
            <Input
              type="password"
              placeholder="Secret Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
            />
            <Input
              placeholder="Alias"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
            />
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="submit"
                className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground w-full"
              >
                Join
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
