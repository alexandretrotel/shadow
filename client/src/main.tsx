import "./index.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/home.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import Account from "./pages/account.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { motion } from "motion/react";
import { Chat } from "./pages/chat.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card text-foreground flex min-h-screen items-center justify-center px-4 antialiased md:px-0"
      >
        <Routes>
          <Route index element={<Home />} />
          <Route path="account" element={<Account />} />
          <Route path="chat/:recipient" element={<Chat />} />
        </Routes>

        <Toaster />
      </motion.div>
    </ThemeProvider>
  </BrowserRouter>,
);
