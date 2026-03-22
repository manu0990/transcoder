import express from "express";
import { env } from "./configs/envs";
import { s3Router } from "./routes/s3.routes";

const app = express();

app.use(express.json());

app.use("/api/s3", s3Router);

app.get("/health", (_, res) => {
  res.status(200).json({
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toISOString(),
    environment: env.node_env,
  });
});

export { app };
