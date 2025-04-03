import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth.store";
import { toast } from "sonner";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { motion } from "motion/react";
import { ThemeProvider } from "./providers/theme-provider";
import { useInitializeSocket } from "./store/socket.store";
import { cn } from "./lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
type FormSchema = z.infer<typeof passwordSchema>;

export const Root = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useInitializeSocket();
  const { username, loadAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    const encrypted = localStorage.getItem("auth-storage");

    if (encrypted && !username) {
      setIsPasswordModalOpen(true);
    }
  }, [username]);

  const handlePasswordSubmit = async (data: FormSchema) => {
    const { password } = data;

    try {
      await loadAuth(password);
      setIsPasswordModalOpen(false);

      navigate("/");
    } catch {
      toast.error("Incorrect password");
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "bg-card text-foreground flex min-h-screen items-center justify-center antialiased",
          location.pathname.startsWith("/chat") && !isPasswordModalOpen
            ? "px-0"
            : "px-4 md:px-0",
        )}
      >
        {isPasswordModalOpen ? (
          <div className="flex h-screen w-screen items-center justify-center">
            <div className="w-full max-w-md space-y-6">
              <h1 className="text-xl font-bold">
                The app is locked, you need to enter your password to unlock it!
              </h1>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handlePasswordSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Unlocking..." : "Unlock"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
        <Toaster />
      </motion.div>
    </ThemeProvider>
  );
};
