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
import { getKeyFingerprint } from "@/lib/crypto";
import { decode } from "@stablelib/base64";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { encode } from "@stablelib/base64";
import { useAuth } from "@/store/auth.store";
import { Contact } from "@/lib/types";

const addContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  publicKey: z.string().min(1, "Public key is required"),
});

type AddContactForm = z.infer<typeof addContactSchema>;

export const AddContact = () => {
  const { addContact, isInContacts } = useContacts();
  const { getKeyPair } = useAuth();

  const keyPair = getKeyPair();
  const myPublicKey = keyPair ? encode(keyPair.publicKey) : "";

  const contactForm = useForm<AddContactForm>({
    resolver: zodResolver(addContactSchema),
    defaultValues: { name: "", publicKey: "" },
  });

  const handleAddContact = async (data: AddContactForm) => {
    const contactName = data.name.trim();
    const publicKey = data.publicKey.trim();

    if (publicKey === myPublicKey) {
      toast.error("You cannot add yourself as a contact");
      return;
    }

    if (isInContacts(publicKey)) {
      toast.error("Contact already exists");
      return;
    }

    try {
      const decodedPublicKey = decode(publicKey);
      const fingerprint = getKeyFingerprint(decodedPublicKey);

      const contact: Contact = { username: contactName, publicKey };
      localStorage.setItem(`fingerprint_${publicKey}`, fingerprint);
      addContact(contact);
      toast.success(`Added ${contactName} with public key`);
      contactForm.reset();
    } catch {
      toast.error("Invalid public key format");
    }
  };

  return (
    <Form {...contactForm}>
      <form
        onSubmit={contactForm.handleSubmit(handleAddContact)}
        className="space-y-4"
      >
        <FormField
          control={contactForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Friend1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <Button
          type="submit"
          disabled={
            !contactForm.watch("name").trim() ||
            !contactForm.watch("publicKey").trim()
          }
        >
          Add Contact
        </Button>
      </form>
    </Form>
  );
};
