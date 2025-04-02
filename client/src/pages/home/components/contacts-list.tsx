import { Button } from "@/components/ui/button";
import { useOnline } from "@/store/online.store";

interface ContactsListProps {
  contacts: string[];
  startChat: (username: string) => void;
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
          <div key={contact} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline(contact)
                    ? "animate-pulse bg-green-500"
                    : "bg-gray-500"
                }`}
              />
              <span>{contact}</span>
            </div>

            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => startChat(contact)}
            >
              Chat
            </Button>
          </div>
        ))
      )}
    </div>
  );
};
