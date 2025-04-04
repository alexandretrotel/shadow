import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WelcomeCard } from "./components/welcome-card";
import { AddContact } from "./components/add-contact";
import { ContactsList } from "./components/contacts-list";
import { useContacts } from "@/store/contacts.store";
import { useAuth } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Home = () => {
  const { contacts } = useContacts();
  const { getKeyPair } = useAuth();
  const navigate = useNavigate();
  const keyPair = getKeyPair();

  const startChat = (contact: string) => {
    navigate(`/chat/${contact}`);
  };

  if (!keyPair) {
    return <WelcomeCard />;
  }

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Welcome to Shadow</h2>
        <Button
          onClick={() => navigate("/account")}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          My Account
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <AddContact />
        <ContactsList contacts={contacts} startChat={startChat} />
      </CardContent>
    </Card>
  );
};
