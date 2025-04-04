import { Contact } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ContactsStore {
  contacts: Contact[];
  addContact: (contact: Contact) => void;
  editContact: (publicKey: string, updatedContact: Contact) => void;
  removeContact: (publicKey: string) => void;
  clearContacts: () => void;
  isInContacts: (publicKey: string) => boolean;
  getContactPublicKey: (username: string) => string | undefined;
  getContactName: (publicKey: string) => string | undefined;
}

export const useContacts = create<ContactsStore>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),

      editContact: (publicKey, updatedContact) =>
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.publicKey === publicKey
              ? { ...contact, ...updatedContact }
              : contact,
          ),
        })),

      removeContact: (publicKey) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.publicKey !== publicKey),
        })),

      clearContacts: () => set({ contacts: [] }),

      isInContacts: (publicKey: string) => {
        return get().contacts.some(
          (contact) => contact.publicKey === publicKey,
        );
      },

      getContactPublicKey: (username: string) => {
        const contact = get().contacts.find(
          (contact) => contact.username === username,
        );

        return contact?.publicKey;
      },

      getContactName: (publicKey) => {
        const contact = get().contacts.find((c) => c.publicKey === publicKey);
        return contact?.username;
      },
    }),
    {
      name: "contacts-storage",
    },
  ),
);
