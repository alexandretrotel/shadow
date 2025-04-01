import express from "express";
import { userRouter } from "./user";

export function setupRoutes(app: express.Express) {
  app.get("/", (_, res) => {
    res.status(200).send("Server is running");
  });
  app.use(userRouter);
}
