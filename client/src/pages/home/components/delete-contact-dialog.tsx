import { Contact } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteContactDialogProps {
  contact: Contact | undefined;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (publicKey: string) => void;
}

export const DeleteContactDialog = ({
  contact,
  isOpen,
  onClose,
  onConfirm,
}: DeleteContactDialogProps) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Contact</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete {contact?.username || "this contact"}?
          This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => contact && onConfirm(contact.publicKey)}
        >
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
