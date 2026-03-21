import express, {Request, Response} from "express";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export { app };