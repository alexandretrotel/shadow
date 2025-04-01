import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ContactsStore {
  contacts: string[];
  addContact: (contact: string) => void;
  removeContact: (contact: string) => void;
  clearContacts: () => void;
  isInContacts: (contact: string) => boolean;
}

export const useContacts = create<ContactsStore>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),

      removeContact: (contact) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c !== contact),
        })),

      clearContacts: () => set({ contacts: [] }),

      isInContacts: (contact: string) => {
        const state = get();
        return state.contacts.includes(contact);
      },
    }),
    {
      name: "contacts-storage",
    },
  ),
);
