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

export function Home() {
  if (!username) {
    return (
      <Card className="w-full max-w-md border-none shadow-none">
        <CardHeader>
          <CardTitle>Welcome to Shadow</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Generate New Account</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader>
        <CardTitle>Welcome, @{username}</CardTitle>
      </CardHeader>
      <CardContent>
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
        <div>
          <h3>Your Contacts</h3>
          {contacts.map((contact) => (
            <div key={contact.username}>
              <span>{contact.username}</span>
              <Button onClick={() => startChat(contact.username)}>Chat</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
