import { Button } from "@/components/ui/button";
import { Contact } from "@/lib/types";
import { useOnline } from "@/store/online.store";

interface ContactsListProps {
  contacts: Contact[];
  startChat: (publicKey: string) => void;
}

export const ContactsList = ({ contacts, startChat }: ContactsListProps) => {
  const { isOnline } = useOnline();

  return (
    <div>
      <h3 className="text-lg font-semibold">Your Contacts</h3>
      {contacts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No contacts added yet.</p>
      ) : (
        contacts.map((contact) => (
          <div
            key={contact.publicKey}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline(contact.publicKey)
                    ? "animate-pulse bg-green-500"
                    : "bg-gray-500"
                }`}
              />
              <span>{contact.username}</span>
            </div>

            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => startChat(contact.publicKey)}
            >
              Chat
            </Button>
          </div>
        ))
      )}
    </div>
  );
};
