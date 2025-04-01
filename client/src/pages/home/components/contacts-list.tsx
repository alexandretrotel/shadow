import { Button } from "@/components/ui/button";

interface ContactsListProps {
  contacts: string[];
  startChat: (username: string) => void;
}

export const ContactsList = ({ contacts, startChat }: ContactsListProps) => (
  <div>
    <h3 className="text-lg font-semibold">Your Contacts</h3>
    {contacts.length === 0 ? (
      <p className="text-muted-foreground text-sm">No contacts added yet.</p>
    ) : (
      contacts.map((contact) => (
        <div key={contact} className="flex items-center justify-between py-2">
          <span>{contact}</span>
          <Button onClick={() => startChat(contact)}>Chat</Button>
        </div>
      ))
    )}
  </div>
);
