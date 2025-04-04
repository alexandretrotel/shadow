import { Contact } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactListItemProps {
  contact: Contact;
  isOnline: boolean;
  onChat: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ContactListItem = ({
  contact,
  isOnline,
  onChat,
  onEdit,
  onDelete,
}: ContactListItemProps) => (
  <li className="hover:bg-muted flex items-center justify-between rounded-md p-2 transition-colors">
    <div className="flex items-center gap-3">
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline ? "animate-pulse bg-green-500" : "bg-gray-500"
        }`}
      />
      <span className="text-sm font-medium">{contact.username}</span>
    </div>

    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={onChat}
      >
        Chat
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={onEdit}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={onDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </li>
);
