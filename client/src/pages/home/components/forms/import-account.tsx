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
import { toast } from "sonner";

const formSchema = z.object({
  privateKey: z.string().min(1, "Private key is required"),
});
type FormSchema = z.infer<typeof formSchema>;

export const ImportAccountForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { privateKey: "" },
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privateKey: data.privateKey,
        }),
      });

      toast.success("Account imported successfully");
      form.reset();
    } catch {
      toast.error("Error importing account");
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
