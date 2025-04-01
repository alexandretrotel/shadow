import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "motion/react";
import { useChatStore } from "@/store/chat-store";
import { useChat } from "@/hooks/use-chat";
import { socketService } from "@/lib/socket-service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from "@stablelib/base64";
import nacl from "tweetnacl";
import { MoreHorizontalIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const usernameSchema = z.object({
  username: z.string().min(1, "Username is required").max(30),
});

type UsernameFormData = z.infer<typeof usernameSchema>;

const contactSchema = z.object({
  contact: z.string().min(1, "Contact is required"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function Home() {
  const [onlineStatus, setOnlineStatus] = useState<
    { username: string; online: boolean }[]
  >([]);

  const navigate = useNavigate();
  const { username, contacts, setUsername, addContact } = useChatStore();
  const { startChat } = useChat();

  const usernameForm = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: username || "" },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contact: "" },
  });

  useEffect(() => {
    if (contacts.length) {
      socketService
        .getSocket()
        .emit(
          "getOnlineStatus",
          { usernames: contacts.map((c) => c.username) },
          (status: { username: string; online: boolean }[]) => {
            setOnlineStatus(status);
          },
        );
    }
  }, [contacts]);

  const handleUsernameSubmit = (data: UsernameFormData) => {
    socketService
      .getSocket()
      .emit(
        "checkUsername",
        { username: data.username },
        ({ available }: { available: boolean }) => {
          if (!available) {
            toast.error("Username is already taken. Try another one.");
          } else {
            const keys = nacl.box.keyPair();
            socketService.setKeyPair(keys);
            socketService.register(data.username, encodeBase64(keys.publicKey));
            setUsername(data.username);
            toast.success(`Welcome, ${data.username}! Your account is ready.`);
          }
        },
      );
  };

  const handleStartChat = (contactUsername: string) => {
    startChat(contactUsername);
    navigate(`/chat/${contactUsername}`);
  };

  const handleAddContact = (data: ContactFormData) => {
    socketService
      .getSocket()
      .emit("requestPublicKey", { username: data.contact });
    socketService
      .getSocket()
      .once("publicKeys", ({ username: contactUsername, publicKey }) => {
        if (publicKey) {
          addContact({
            username: contactUsername,
            publicKey: decodeBase64(publicKey),
          });
          toast.success(`${contactUsername} added to your contacts!`);
          contactForm.reset();
        } else {
          toast.error(`User ${data.contact} does not exist.`);
        }
      });
  };

  if (!username) {
    return (
      <Card className="w-full max-w-md gap-8 border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-secondary-foreground text-2xl tracking-wide">
            Welcome to Shadow
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Choose a username to get started
          </p>
        </CardHeader>
        <CardContent>
          <Form {...usernameForm}>
            <form
              onSubmit={usernameForm.handleSubmit(handleUsernameSubmit)}
              className="space-y-4"
            >
              <FormField
                control={usernameForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ShadowUser"
                        {...field}
                        className="bg-muted text-foreground placeholder-muted-foreground border-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="bg-primary text-primary-foreground w-full"
              >
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md gap-8 border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-secondary-foreground text-2xl tracking-wide">
          Welcome, @{username}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/account")}
          className="mt-2"
        >
          Manage Account
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
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
                    <Input
                      placeholder="e.g., ShadowFriend"
                      {...field}
                      className="bg-muted text-foreground placeholder-muted-foreground border-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="bg-primary text-primary-foreground w-full"
            >
              Add Contact
            </Button>
          </form>
        </Form>
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">
            Your Contacts
          </h3>
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <motion.div
                key={contact.username}
                whileHover={{ scale: 1.02 }}
                className="bg-muted flex items-center justify-between rounded-md p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{contact.username}</span>
                  {onlineStatus.find((s) => s.username === contact.username)
                    ?.online && (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartChat(contact.username)}
                  >
                    Chat
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                      >
                        <MoreHorizontalIcon size={16} />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="bg-card w-48 p-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive w-full"
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {contact.username}{" "}
                              from your contacts? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                useChatStore.setState((state) => ({
                                  ...state,
                                  contacts: state.contacts.filter(
                                    (c) => c.username !== contact.username,
                                  ),
                                }));
                                toast.success(`
                              ${contact.username} removed from contacts.
                            `);
                              }}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </PopoverContent>
                  </Popover>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-muted-foreground text-xs">
              No contacts yet. Add someone to start chatting!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
