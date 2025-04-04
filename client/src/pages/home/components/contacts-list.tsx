import { useState } from "react";
import { Contact } from "@/lib/types";
import { useOnline } from "@/store/online.store";
import { useContacts } from "@/store/contacts.store";
import { toast } from "sonner";
import { ContactListItem } from "./contact-list-item";
import { EditContactDialog } from "./edit-contact-dialog";
import { DeleteContactDialog } from "./delete-contact-dialog";

interface ContactsListProps {
  contacts: Contact[];
  startChat: (publicKey: string) => void;
}

export const ContactsList = ({ contacts, startChat }: ContactsListProps) => {
  const { isOnline } = useOnline();
  const { removeContact } = useContacts();
  const [editContactData, setEditContactData] = useState<Contact | null>(null);
  const [deleteContactPublicKey, setDeleteContactPublicKey] = useState<
    string | null
  >(null);

  const handleDelete = (publicKey: string) => {
    removeContact(publicKey);
    localStorage.removeItem(`fingerprint_${publicKey}`);
    toast.success("Contact deleted");
    setDeleteContactPublicKey(null);
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">Your Contacts</h3>
      {contacts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No contacts added yet.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <ContactListItem
              key={contact.publicKey}
              contact={contact}
              isOnline={isOnline(contact.publicKey)}
              onChat={() => startChat(contact.publicKey)}
              onEdit={() => setEditContactData(contact)}
              onDelete={() => setDeleteContactPublicKey(contact.publicKey)}
            />
          ))}
        </ul>
      )}

      <EditContactDialog
        contact={editContactData}
        onClose={() => setEditContactData(null)}
      />

      <DeleteContactDialog
        contact={contacts.find((c) => c.publicKey === deleteContactPublicKey)}
        isOpen={!!deleteContactPublicKey}
        onClose={() => setDeleteContactPublicKey(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
