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
import { encode as encodeBase64 } from "@stablelib/base64";
import nacl from "tweetnacl";

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
  const { username, contacts, setUsername } = useChatStore();
  const { startChat } = useChat();

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

  const usernameForm = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: username || "" },
  });

  const addContactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contact: "" },
  });

  const handleUsernameSubmit = (data: UsernameFormData) => {
    socketService
      .getSocket()
      .emit(
        "checkUsername",
        { username: data.username },
        ({ available }: { available: boolean }) => {
          if (!available) {
            toast.error("Username taken");
          } else {
            const keys = nacl.box.keyPair();
            socketService.setKeyPair(keys);
            socketService.register(data.username, encodeBase64(keys.publicKey));
            setUsername(data.username);
          }
        },
      );
  };

  const handleStartChat = (contactUsername: string) => {
    startChat(contactUsername);
    navigate(`/chat/${contactUsername}`);
  };

  const handleAddContact = (contactUsername: string) => {
    socketService.requestPublicKey(contactUsername);
  };

  if (!username) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full px-4"
      >
        <Card className="mx-auto mt-10 max-w-md border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-secondary-foreground text-lg tracking-wide">
              Set Your Username
            </CardTitle>
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
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Pseudonym</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John The Ripper"
                          {...field}
                          className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    type="submit"
                    className="bg-secondary text-secondary-foreground w-full"
                  >
                    Enter the Shadows
                  </Button>
                </motion.div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full px-4"
    >
      <Card className="mx-auto mt-12 max-w-md border-none shadow-none">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-secondary-foreground text-lg tracking-wide">
            Contacts
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/account")}
            className="text-sm"
          >
            My Account
          </Button>
        </CardHeader>

        <CardContent>
          <div className="space-y-8">
            <Form {...addContactForm}>
              <form
                className="flex flex-col gap-3"
                onSubmit={addContactForm.handleSubmit((data) => {
                  handleAddContact(data.contact);
                  addContactForm.reset();
                })}
              >
                <FormField
                  control={addContactForm.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add a Contact</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter username"
                          {...field}
                          className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent w-full border-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="bg-secondary text-secondary-foreground"
                >
                  Add Contact
                </Button>
              </form>
            </Form>

            <div className="space-y-2">
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <motion.div
                    key={contact.username}
                    whileHover={{ scale: 1.02 }}
                    className="bg-muted flex items-center justify-between rounded-md p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {contact.username}
                      {onlineStatus.find((s) => s.username === contact.username)
                        ?.online && (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-foreground text-muted-foreground"
                      onClick={() => handleStartChat(contact.username)}
                    >
                      Chat
                    </Button>
                  </motion.div>
                ))
              ) : (
                <p className="text-muted-foreground text-center text-sm">
                  No contacts yet. Add someone to start chatting!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
