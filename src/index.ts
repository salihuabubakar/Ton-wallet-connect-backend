import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './lib/dbConnection.ts';
import cors from 'cors';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.ts";
import checkinRoutes from "./routes/checkin.ts";
import profileRoutes from "./routes/profile.ts";
import leaderboardRoutes from "./routes/leaderboard.ts";

async function start() {

  // Load environment variables

  dotenv.config({
    path: "./.env",
  });

  // Create a new express application
  const app = express();
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(express.json());
  app.use(helmet());
  app.use(apiLimiter);
  app.use(
    cors({
      origin: process.env.NEXT_PUBLIC_CORS_ORIGIN as string,
      credentials: true
    })
  )

  // Routes
  app.get('/', (req, res) => {
    res.json('Hello, World!');
  });
  app.use("/auth", authRoutes);
  app.use("/checkin", checkinRoutes);
  app.use("/profile", profileRoutes);
  app.use("/leaderboard", leaderboardRoutes);


  // Connect to Database
  await connectToDatabase();

  app.listen(process.env.NEXT_PUBLIC_HTTP_PORT, () => {
    console.log('Server is running on port ' + process.env.NEXT_PUBLIC_HTTP_PORT);
  });
}

start();