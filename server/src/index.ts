import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_, res) => {
  res.status(200).json({

    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export { app };
