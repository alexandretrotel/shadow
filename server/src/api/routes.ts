import express from "express";

export function setupRoutes(app: express.Express) {
  app.get("/", (req, res) => {
    res.send(
      `Shadow E2EE Chat Backend - Running in ${process.env.NODE_ENV || "production"} mode`
    );
  });
}
