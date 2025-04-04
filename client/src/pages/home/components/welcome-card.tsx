import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/store/auth.store";
import { generateKeyPair, getKeyPairFromPrivateKey } from "@/lib/crypto";
import { toast } from "sonner";
import { decode } from "@stablelib/base64";

const authSchema = z
  .object({
    privateKey: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
  });

type AuthForm = z.infer<typeof authSchema>;

export const WelcomeCard = () => {
  const [isGenerating, setIsGenerating] = useState(true);
  const { setAuth } = useAuth();

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onGenerate = async (data: AuthForm) => {
    try {
      const keyPair = generateKeyPair();
      await setAuth(keyPair, data.password);
      toast.success("Key pair generated successfully");
      form.reset();
    } catch {
      toast.error("Failed to generate key pair");
    }
  };

  const onImport = async (data: AuthForm) => {
    const privateKey = data.privateKey?.trim();

    if (!privateKey) {
      toast.error("Private key is required");
      return;
    }

    try {
      const keyPair = getKeyPairFromPrivateKey(decode(privateKey));
      await setAuth(keyPair, data.password);
      toast.success("Key pair imported successfully");
      form.reset();
    } catch {
      toast.error("Failed to import key pair");
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-none">
      <CardHeader>
        <CardTitle>Welcome to Shadow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex space-x-2">
          <Button
            variant={isGenerating ? "default" : "outline"}
            onClick={() => setIsGenerating(true)}
          >
            Generate Key Pair
          </Button>
          <Button
            variant={!isGenerating ? "default" : "outline"}
            onClick={() => setIsGenerating(false)}
          >
            Import Key Pair
          </Button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(isGenerating ? onGenerate : onImport)}
            className="space-y-4"
          >
            {!isGenerating && (
              <FormField
                control={form.control}
                name="privateKey"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Paste your private key here"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter a password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit">
              {isGenerating ? "Generate" : "Import"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
