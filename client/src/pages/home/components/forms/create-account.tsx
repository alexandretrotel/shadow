import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { generateKeyPair } from "@shared/src/crypto";
import { toast } from "sonner";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});
type FormSchema = z.infer<typeof formSchema>;

export const CreateAccountForm = () => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" },
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          publicKey: generateKeyPair().publicKey,
        }),
      });

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
