import "./index.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./components/home.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { ChatRoomWrapper } from "./wrappers/chatroom-wrapper.tsx";
import Account from "./components/account.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { motion } from "motion/react";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card text-foreground flex min-h-screen items-center justify-center antialiased"
      >
        <Routes>
          <Route index element={<Home />} />
          <Route path="account" element={<Account />} />
          <Route path="chat/:recipient" element={<ChatRoomWrapper />} />
        </Routes>

        <Toaster />
      </motion.div>
    </ThemeProvider>
  </BrowserRouter>,
);
