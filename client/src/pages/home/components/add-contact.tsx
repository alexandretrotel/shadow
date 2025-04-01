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

export const AddContact = () => {
  const { addContact, isInContacts } = useContacts();

  const contactForm = useForm({
    defaultValues: {
      contact: "",
    },
  });

  const handleAddContact = async (data: { contact: string }) => {
    try {
      const response = await fetch(`${SERVER_URL}/user/${data.contact}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("User not found");
      }

      if (isInContacts(data.contact)) {
        toast.error("Contact already exists");
        return;
      }

      addContact(data.contact);
      contactForm.reset();
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
