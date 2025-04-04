import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { setupRoutes } from "./api/routes";
import { setupSockets } from "./api/sockets";

function getCorsOrigins() {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      return [
        "https://shadow.alexandretrotel.org", // Production client
        "https://shadow-backend.alexandretrotel.org", // Production backend
      ];
    default:
      return "*"; // Allow all origins in development
  }
}

const app = express();
app.use(
  cors({
    origin: getCorsOrigins(),
  })
);
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
  },
});

setupRoutes(app);
setupSockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
