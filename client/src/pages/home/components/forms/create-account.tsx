import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { generateKeyPair } from "@/lib/crypto";
import { toast } from "sonner";
import {
  createAccountFormSchema,
  CreateAccountFormSchema,
} from "./auth-schemas";
import { SERVER_URL } from "@/lib/server";
import { encode } from "@stablelib/base64";
import { useAuth } from "@/store/auth.store";
import { z } from "zod";

const userSchema = z.object({
  user: z.object({
    username: z.string(),
    publicKey: z.string(),
    createdAt: z.union([
      z
        .string()
        .transform((val) => new Date(val).toISOString() as unknown as Date),
      z.date(),
    ]),
  }),
});

export const CreateAccountForm = () => {
  const { setAuth } = useAuth();

  const form = useForm<CreateAccountFormSchema>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: CreateAccountFormSchema) => {
    try {
      const usernameResponse = await fetch(
        `${SERVER_URL}/user/${data.username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!usernameResponse.ok) {
        throw new Error("Error checking username");
      }

      const usernameData = await usernameResponse.json();
      const { user } = userSchema.parse(usernameData);

      if (user) {
        toast.error("Username already exists");
        return;
      }

      const keyPair = generateKeyPair();

      const response = await fetch(`${SERVER_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          publicKey: encode(keyPair.publicKey),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      await setAuth(data.username, keyPair, data.password);

      toast.success("Account created successfully");
      form.reset();
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Error creating account");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Enter a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <Button
          className="w-full"
          type="submit"
          disabled={!form.watch("username").trim()}
        >
          Create Account
        </Button>
      </form>
    </Form>
  );
};
