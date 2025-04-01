import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./components/home.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { ChatRoomWrapper } from "./wrappers/chatroom-wrapper.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="chat/:recipient" element={<ChatRoomWrapper />} />
        </Route>
      </Routes>
    </BrowserRouter>

    <Toaster />
  </StrictMode>,
);
