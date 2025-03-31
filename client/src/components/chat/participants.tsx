import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Participant } from "@/types/chat";

interface ParticipantsProps {
  roomName: string;
  participants: Participant[];
  onLeave: () => void;
  getKeyFingerprint: (key: Uint8Array) => string;
}

export const Participants = ({
  roomName,
  participants,
  onLeave,
  getKeyFingerprint,
}: ParticipantsProps) => (
  <CardHeader className="flex-shrink-0 border-b border-muted pt-6">
    <div className="flex justify-between items-center">
      <CardTitle className="text-lg text-secondary-foreground tracking-wide">
        Room: {roomName}
      </CardTitle>
      <Button
        onClick={onLeave}
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-accent-foreground"
      >
        Leave
      </Button>
    </div>
    {participants.length > 0 && (
      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
        {participants.map((p) => (
          <span key={p.username} className="bg-muted px-2 py-1 rounded">
            {p.username} ({getKeyFingerprint(p.publicKey)})
          </span>
        ))}
      </div>
    )}
  </CardHeader>
);
