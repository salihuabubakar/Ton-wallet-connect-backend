import express from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        walletAddress: string;
        [key: string]: any;
      };
    }
  }
}

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
  if (!req.user || !req.user.walletAddress) {
    return res.status(401).json({ error: "Unauthorized: walletAddress missing" });
  }
  const { walletAddress } = req.user;
  const user = await User.findOne({ walletAddress });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const now = new Date();
  const last = user.lastCheckIn;

  // If there is a previous check-in (`last`), compute the time difference
  // between now and the last check-in. If it's less than 24 hours, the user
  // has already checked in within the allowed window, so reject with 429.
  if (last && (now.getTime() - new Date(last).getTime()) < 24 * 3600 * 1000) {
    return res.status(429).json({ error: "Already checked in today" });
  }

  // Determine if streak continues or resets
  // Check whether there is a previous check-in and if the gap between now and the last
  // check-in is less than or equal to 24 hours. If so, we consider the streak to continue.
  const streakContinues = last && (now.getTime() - new Date(last).getTime()) <= 24 * 3600 * 1000;

  // If the streak continues, increment the existing streak (or start from 0 if undefined).
  // Otherwise reset the streak to 1 (this is the first check-in in a new streak).
  const newStreak = streakContinues ? (user.streak || 0) + 1 : 1;

  user.streak = newStreak;
  user.heroPoints = (user.heroPoints || 0) + 10;
  user.lastCheckIn = now;

  await user.save();

  res.json(user);
});

export default router;