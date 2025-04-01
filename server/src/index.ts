import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://shadow.alexandretrotel.org"
        : "*",
  })
);
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://shadow.alexandretrotel.org"
        : "*",
  },
});

setupRoutes(app);
setupSockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
