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

export const AddContact = () => {
  const { addContact, isInContacts } = useContacts();

  const contactForm = useForm({
    defaultValues: {
      contact: "",
    },
  });

  const handleAddContact = async (data: { contact: string }) => {
    const contact = data.contact.trim();

    if (isInContacts(contact)) {
      toast.error("Contact already exists");
      return;
    }

    try {
      const userResponse = await fetch(`${SERVER_URL}/user/${contact}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!userResponse.ok) {
        throw new Error("User not found");
      }

      const keyResponse = await fetch(`${SERVER_URL}/public-key/${contact}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!keyResponse.ok) {
        throw new Error("Public key not found");
      }

      const keyData = await keyResponse.json();
      const { publicKey } = publicKeySchema.parse(keyData);
      const decodedPublicKey = decode(publicKey);
      const fingerprint = getKeyFingerprint(decodedPublicKey);

      // Check stored fingerprint
      const storedFingerprint = localStorage.getItem(`fingerprint_${contact}`);
      if (storedFingerprint && storedFingerprint !== fingerprint) {
        toast.error(`Warning: Public key for ${contact} has changed!`);
        return;
      }

      // Store fingerprint and add contact
      localStorage.setItem(`fingerprint_${contact}`, fingerprint);
      addContact(contact);
      contactForm.reset();
      toast.success(`Added ${contact} to contacts`);
    } catch {
      toast.error("User not found");
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
        <Button type="submit">Add Contact</Button>
      </form>
    </Form>
  );
};
