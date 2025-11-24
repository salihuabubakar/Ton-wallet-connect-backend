import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const top = await User.find().sort({ heroPoints: -1 }).limit(10);
  res.json(top);
});

export default router;
