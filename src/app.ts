import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectToDatabase } from "./lib/dbConnection.ts";
import authRoutes from "./routes/auth.ts";
import checkinRoutes from "./routes/checkin.ts";
import profileRoutes from "./routes/profile.ts";
import leaderboardRoutes from "./routes/leaderboard.ts";

dotenv.config();

const app = express();

// Security & parsing
app.use(express.json());
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_CORS_ORIGIN,
    credentials: true,
  })
);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.use("/auth", authRoutes);
app.use("/checkin", checkinRoutes);
app.use("/profile", profileRoutes);
app.use("/leaderboard", leaderboardRoutes);

// Lazy DB initialization (serverless safe)
let dbReady = false;

app.use(async (req, res, next) => {
  if (!dbReady) {
    try {
      await connectToDatabase();
      dbReady = true;
    } catch (err) {
      console.error("DB connection failed:", err);
      return res.status(500).json({ error: "DB connection failed" });
    }
  }
  next();
});

export default app;
