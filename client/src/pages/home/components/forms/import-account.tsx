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

const formSchema = z.object({
  privateKey: z.string().min(1, "Private key is required"),
});

export const ImportAccountForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { privateKey: "" },
  });

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
