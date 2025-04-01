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

export const AddContact = () => {
  const { addContact } = useContacts();

  const contactForm = useForm({
    defaultValues: {
      contact: "",
    },
  });

  const handleAddContact = (data: { contact: string }) => {
    addContact(data.contact);
    contactForm.reset();
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
