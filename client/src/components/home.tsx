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
import { decode as decodeBase64 } from "@stablelib/base64";
import nacl from "tweetnacl";
import { storeKeyPair } from "@/lib/storage";

const contactSchema = z.object({
  contact: z.string().min(1, "Contact username is required").max(30),
});
type ContactFormData = z.infer<typeof contactSchema>;

const importSchema = z.object({
  username: z.string().min(1, "Username is required").max(30),
  privateKey: z.string().min(1, "Private key is required"),
});
type ImportFormData = z.infer<typeof importSchema>;

export function Home() {
  const [onlineStatus, setOnlineStatus] = useState<
    { username: string; online: boolean }[]
  >([]);

  const navigate = useNavigate();
  const { username, contacts, setUsername, addContact } = useChatStore();
  const { startChat } = useChat();

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contact: "" },
  });

  const importForm = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: { username: "", privateKey: "" },
  });

  useEffect(() => {
    if (username && !socketService.getSocket().connected) {
      socketService.connect(username);
    }
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
  }, [contacts, username]);

  const handleImport = async (data: ImportFormData) => {
    const { username, privateKey } = data;
    const { available } = await socketService.checkUsername(username);
    if (available) {
      toast.error("Username not registered. Please check your credentials.");
      return;
    }

    const secretKey = decodeBase64(privateKey);
    if (secretKey.length !== nacl.box.secretKeyLength) {
      toast.error("Invalid private key length.");
      return;
    }

    const { publicKey } = await socketService.getPublicKey(username);
    const keyPair = { publicKey: decodeBase64(publicKey), secretKey };
    storeKeyPair(keyPair);
    setUsername(username);
    socketService.connect(username);
    toast.success(`Welcome back, ${username}!`);
  };

  const handleStartChat = (contactUsername: string) => {
    startChat(contactUsername);
    navigate(`/chat/${contactUsername}`);
  };

  const handleAddContact = async (data: ContactFormData) => {
    try {
      const { username: contactUsername, publicKey } =
        await socketService.getPublicKey(data.contact);
      addContact({
        username: contactUsername,
        publicKey: decodeBase64(publicKey),
      });
      toast.success(`${contactUsername} added to your contacts!`);
      contactForm.reset();
    } catch {
      toast.error(`User ${data.contact} does not exist.`);
    }
  };

  if (!username) {
    return (
      <Card className="w-full max-w-md gap-8 border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-secondary-foreground text-2xl tracking-wide">
            Welcome to Shadow
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Import your account with your private key
          </p>
        </CardHeader>
        <CardContent>
          <Form {...importForm}>
            <form
              onSubmit={importForm.handleSubmit(handleImport)}
              className="space-y-4"
            >
              <FormField
                control={importForm.control}
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
              <FormField
                control={importForm.control}
                name="privateKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Private Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Base64-encoded private key"
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
                Import Account
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartChat(contact.username)}
                >
                  Chat
                </Button>
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
