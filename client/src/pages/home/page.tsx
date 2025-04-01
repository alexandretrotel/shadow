import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WelcomeCard } from "./components/welcome-card";
import { AddContact } from "./components/add-contact";
import { ContactsList } from "./components/contacts-list";
import { useContacts } from "@/store/contacts.store";
import { useAuth } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const { contacts } = useContacts();
  const { username } = useAuth();
  const navigate = useNavigate();

  const startChat = (contact: string) => {
    navigate(`/chat/${contact}`);
  };

  if (!username) {
    return <WelcomeCard />;
  }

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader>
        <h2 className="text-2xl font-semibold">Welcome, @{username}</h2>
      </CardHeader>

      <CardContent className="space-y-8">
        <AddContact />
        <ContactsList contacts={contacts} startChat={startChat} />
      </CardContent>
    </Card>
  );
};
