import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ContactsStore {
  contacts: string[];
  addContact: (contact: string) => void;
  removeContact: (contact: string) => void;
  clearContacts: () => void;
}

export const useContacts = create<ContactsStore>()(
  persist(
    (set) => ({
      contacts: [],

      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),

      removeContact: (contact) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c !== contact),
        })),

      clearContacts: () => set({ contacts: [] }),
    }),
    {
      name: "contacts-storage",
    },
  ),
);
