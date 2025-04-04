import { Contact } from "@/lib/types";
import { useContacts } from "@/store/contacts.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

interface EditContactDialogProps {
  contact: Contact | null;
  onClose: () => void;
}

const editContactSchema = z.object({
  username: z.string().min(1, "Name is required"),
  publicKey: z.string().min(1, "Public key is required"),
});
type EditContactForm = z.infer<typeof editContactSchema>;

export const EditContactDialog = ({
  contact,
  onClose,
}: EditContactDialogProps) => {
  const { editContact } = useContacts();

  const editForm = useForm<EditContactForm>({
    resolver: zodResolver(editContactSchema),
    defaultValues: contact
      ? { username: contact.username, publicKey: contact.publicKey }
      : undefined,
  });

  const handleSubmit = (data: EditContactForm) => {
    if (!contact) return;

    try {
      editContact(contact.publicKey, {
        username: data.username,
        publicKey: data.publicKey,
      });
      toast.success(`Updated contact ${data.username}`);
      onClose();
    } catch {
      toast.error("Failed to update contact");
    }
  };

  return (
    <Dialog open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update the name or public key of this contact.
          </DialogDescription>
        </DialogHeader>

        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={editForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Friend1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
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

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
