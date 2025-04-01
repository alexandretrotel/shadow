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
import { toast } from "sonner";
import { useAuth } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";
import { decode } from "@stablelib/base64";
import { getPublicKeyFromPrivateKey } from "@shared/src/crypto";
import {
  importFormSchema,
  ImportFormSchema,
  usernameSchema,
} from "./auth-schemas";

export const ImportAccountForm = () => {
  const { setKeyPair, setUsername } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(importFormSchema),
    defaultValues: { privateKey: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ImportFormSchema) => {
    try {
      const { password } = importFormSchema.parse(data);

      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privateKey: data.privateKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to import account");
      }

      const responseData = await response.json();
      const username = usernameSchema.parse(responseData.username);

      setUsername(username, password);
      setKeyPair(
        {
          secretKey: decode(data.privateKey),
          publicKey: getPublicKeyFromPrivateKey(decode(data.privateKey)),
        },
        password,
      );

      toast.success("Account imported successfully");
      form.reset();
      navigate("/");
    } catch {
      toast.error("Failed to import account");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="privateKey"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Paste your private key" {...field} />
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
                  placeholder="Enter your password"
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
          disabled={!form.watch("privateKey").trim()}
        >
          Import Account
        </Button>
      </form>
    </Form>
  );
};
