import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { setupRoutes } from "./api/routes";
import { setupSockets } from "./api/sockets";

function getCorsOrigins() {
  const env = process.env.NODE_ENV || "production"; // Default to "production" if not set

  switch (env) {
    case "production":
      return [
        "https://shadow.alexandretrotel.org", // Production client
        "https://shadow-backend.alexandretrotel.org", // Production backend
      ];
    default:
      return "*"; // Development or fallback (e.g., localhost)
  }
}

const app = express();
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://shadow.alexandretrotel.org",
            "https://shadow-*-alexandretrotel.vercel.app",
          ]
        : "*",
  })
);
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://shadow.alexandretrotel.org",
            "https://shadow-*-alexandretrotel.vercel.app",
          ]
        : "*",
  },
});

setupRoutes(app);
setupSockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
