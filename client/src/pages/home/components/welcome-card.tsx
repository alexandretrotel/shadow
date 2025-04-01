import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportAccountForm } from "./forms/import-account";
import { CreateAccountForm } from "./forms/create-account";

export const WelcomeCard = () => {
  const [isImporting, setIsImporting] = useState(false);

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader>
        <CardTitle>Welcome to Shadow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex space-x-2">
          <Button
            variant={!isImporting ? "default" : "outline"}
            onClick={() => setIsImporting(false)}
          >
            Create Account
          </Button>
          <Button
            variant={isImporting ? "default" : "outline"}
            onClick={() => setIsImporting(true)}
          >
            Import Account
          </Button>
        </div>

        {isImporting ? <ImportAccountForm /> : <CreateAccountForm />}
      </CardContent>
    </Card>
  );
};
