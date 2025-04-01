import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WelcomeCard } from "./components/welcome-card";
import { AddContact } from "./components/add-contact";
import { ContactsList } from "./components/contacts-list";
import { useContacts } from "@/store/contacts.store";

export const Home = () => {
  const { contacts } = useContacts();

  if (!username) {
    return <WelcomeCard />;
  }

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader>
        <h2 className="text-2xl font-semibold">Welcome, @{username}</h2>
      </CardHeader>

      <CardContent>
        <AddContact />
        <ContactsList contacts={contacts} startChat={startChat} />
      </CardContent>
    </Card>
  );
};
