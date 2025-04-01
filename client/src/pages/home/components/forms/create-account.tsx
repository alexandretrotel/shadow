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

export const CreateAccountForm = () => {
  const form = useForm<CreateAccountFormSchema>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: CreateAccountFormSchema) => {
    try {
      const response = await fetch(`${SERVER_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          publicKey: generateKeyPair().publicKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      toast.success("Account created successfully");
      form.reset();
    } catch {
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
