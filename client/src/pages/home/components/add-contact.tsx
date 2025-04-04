import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContacts } from "@/store/contacts.store";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SERVER_URL } from "@/lib/server";
import { getKeyFingerprint } from "@/lib/crypto";
import { decode } from "@stablelib/base64";
import { publicKeySchema } from "@/lib/schemas";
import { useAuth } from "@/store/auth.store";
import { useState } from "react";
import { z } from "zod";
import { Contact } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";

const addContactSchema = z.object({
  contact: z.string().min(1, "Contact name is required"),
  publicKey: z.string().min(1, "Public key is required"),
});

type AddContactForm = z.infer<typeof addContactSchema>;

export const AddContact = () => {
  const [useLocal, setUseLocal] = useState(false);

  const { addContact, isInContacts } = useContacts();
  const { username } = useAuth();

  const contactForm = useForm<AddContactForm>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      contact: "",
      publicKey: "",
    },
  });

  const handleAddContact = async (data: AddContactForm) => {
    let contactName = data.contact.trim();
    const publicKey = data.publicKey.trim();
    const contact: Contact = { username: contactName, publicKey };

    if (contactName === username) {
      toast.error("You cannot add yourself as a contact");
      return;
    }

    if (isInContacts(contactName)) {
      toast.error("Contact already exists");
      return;
    }

    if (useLocal && publicKey) {
      // Local management of public keys
      try {
        const decodedPublicKey = decode(publicKey);
        const fingerprint = getKeyFingerprint(decodedPublicKey);
        contactName = `local-${contactName}`; // Prepend "local-" for local contacts

        const contact: Contact = {
          username: contactName,
          publicKey,
        };

        localStorage.setItem(`fingerprint_${contactName}`, fingerprint);
        addContact(contact);
        toast.success(`Added ${contactName} locally with public key`);
      } catch {
        toast.error("Invalid public key format");
        return;
      }
    } else {
      // Fetch public key from registry
      try {
        const userResponse = await fetch(`${SERVER_URL}/user/${contactName}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!userResponse.ok) {
          throw new Error("User not found");
        }

        const keyResponse = await fetch(
          `${SERVER_URL}/public-key/${contactName}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!keyResponse.ok) {
          throw new Error("Public key not found");
        }

        const keyData = await keyResponse.json();
        const { publicKey } = publicKeySchema.parse(keyData);
        const decodedPublicKey = decode(publicKey);
        const fingerprint = getKeyFingerprint(decodedPublicKey);

        // Check stored fingerprint
        const storedFingerprint = localStorage.getItem(
          `fingerprint_${contactName}`,
        );
        if (storedFingerprint && storedFingerprint !== fingerprint) {
          toast.error(`Warning: Public key for ${contactName} has changed!`);
          return;
        }

        // Store fingerprint and add contact
        localStorage.setItem(`fingerprint_${contactName}`, fingerprint);
        addContact(contact);
        contactForm.reset();
        toast.success(`Added ${contactName} to contacts`);
      } catch {
        toast.error("User not found in the registry");
      }
    }
  };

  return (
    <Form {...contactForm}>
      <form
        onSubmit={contactForm.handleSubmit(handleAddContact)}
        className="space-y-8"
      >
        <div className="flex items-center gap-2">
          <Button
            variant={useLocal ? "ghost" : "outline"}
            onClick={() => setUseLocal(false)}
          >
            Use Registry
          </Button>
          <Button
            variant={useLocal ? "outline" : "ghost"}
            onClick={() => setUseLocal(true)}
          >
            Use Local
          </Button>
        </div>

        <div className="space-y-4">
          <FormField
            control={contactForm.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add Contact</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ShadowFriend" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {useLocal && (
            <FormField
              control={contactForm.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Paste public key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit">Add Contact</Button>
        </div>
      </form>
    </Form>
  );
};
