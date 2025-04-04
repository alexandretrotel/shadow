import { Contact } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ContactsStore {
  contacts: Contact[];
  addContact: (contact: Contact) => void;
  removeContact: (username: string) => void;
  clearContacts: () => void;
  isInContacts: (username: string) => boolean;
  getContactPublicKey: (username: string) => string | undefined;
}

export const useContacts = create<ContactsStore>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),

      removeContact: (username) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.username !== username),
        })),

      clearContacts: () => set({ contacts: [] }),

      isInContacts: (username: string) => {
        return get().contacts.some((contact) => contact.username === username);
      },

      getContactPublicKey: (username: string) => {
        const contact = get().contacts.find(
          (contact) => contact.username === username,
        );

        return contact?.publicKey;
      },
    }),
    {
      name: "contacts-storage",
    },
  ),
);
