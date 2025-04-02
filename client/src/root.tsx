import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { motion } from "motion/react";
import { ThemeProvider } from "./providers/theme-provider";

export const Root = () => {
  const [password, setPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { username, loadAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const encrypted = localStorage.getItem("auth-storage");

    if (encrypted && !username) {
      setIsPasswordModalOpen(true);
    }
  }, [username]);

  const handlePasswordSubmit = async () => {
    try {
      await loadAuth(password);
      setIsPasswordModalOpen(false);

      toast.success("Authentication loaded successfully");
      navigate("/");
    } catch {
      toast.error("Incorrect password or failed to load authentication");
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`bg-card text-foreground flex min-h-screen items-center justify-center antialiased ${
          !location.pathname.startsWith("/chat") ? "px-4 md:px-0" : "px-0"
        }`}
      >
        <Dialog
          open={isPasswordModalOpen}
          onOpenChange={setIsPasswordModalOpen}
        >
          <DialogContent className="backdrop-blur">
            <DialogHeader>
              <DialogTitle>Enter Password</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />

              <Button onClick={handlePasswordSubmit} className="w-full">
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Outlet />
        <Toaster />
      </motion.div>
    </ThemeProvider>
  );
};
