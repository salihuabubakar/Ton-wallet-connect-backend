import express from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { getUTCMidnight, isSameUTCDay, isYesterdayUTCDay } from "../utils/dates.ts"

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
  const last = user.lastCheckIn ? new Date(user.lastCheckIn) : null;

  // Prevent multiple check-ins in the same UTC day
  const todayStartUTC = getUTCMidnight(now);

  if (last && isSameUTCDay(last, todayStartUTC)) {
    return res.status(429).json({ error: "Already checked in today" });
  }

  // Determine whether streak continues or resets
  let newStreak = 1;

  if (last) {
    if (isYesterdayUTCDay(last, todayStartUTC)) {
      // Streak continues
      newStreak = (user.streak || 0) + 1;
    } else {
      // Missed yesterday — streak resets
      newStreak = 1;
    }
  }

  user.streak = newStreak;
  user.heroPoints = (user.heroPoints || 0) + 10;
  user.lastCheckIn = now;

  await user.save();

  res.json(user);
});

export default router;