import { useState } from "react";
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

const usernameSchema = z.object({
  username: z.string().min(1, "Username is required").max(30),
});

type UsernameFormData = z.infer<typeof usernameSchema>;

export function Home() {
  const { username, contacts, setUsername, addContact } = useChatStore();
  const { startChat } = useChat();
  const [newContact, setNewContact] = useState("");

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: username || "" },
  });

  const onSubmit = (data: UsernameFormData) => {
    setUsername(data.username);
  };

  const handleStartChat = (contactUsername: string) => {
    startChat(contactUsername);
  };

  const handleAddContact = () => {
    if (newContact && !contacts.some((c) => c.username === newContact)) {
      const publicKey = new Uint8Array(); // TODO: Get the public key of the new contact
      addContact({ username: newContact, publicKey });
      setNewContact("");
    }
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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
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
                    className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground w-full"
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
      <Card className="mx-auto mt-10 max-w-md border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-secondary-foreground text-lg tracking-wide">
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new contact"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              className="bg-muted text-foreground placeholder-muted-foreground focus:ring-accent border-none"
            />
            <Button
              onClick={handleAddContact}
              className="bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {contacts.map((contact) => (
              <motion.div
                key={contact.username}
                whileHover={{ scale: 1.02 }}
                className="bg-muted flex items-center justify-between rounded p-2"
              >
                <span>{contact.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartChat(contact.username)}
                  className="text-muted-foreground hover:text-accent-foreground"
                >
                  Chat
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
