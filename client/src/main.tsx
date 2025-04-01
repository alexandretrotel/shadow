import "./index.css";

import { Home } from "./pages/home/page.tsx";
import { Chat } from "./pages/chat/page.tsx";
import { Account } from "./pages/account/page.tsx";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Root } from "./root.tsx";

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/chat/:recipient",
        element: <Chat />,
      },
      {
        path: "/account",
        element: <Account />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
