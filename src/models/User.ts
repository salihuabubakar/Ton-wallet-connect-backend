import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, unique: true, required: true },
  heroPoints: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastCheckIn: { type: Date, default: null }
});

UserSchema.index({ heroPoints: -1 });

export default mongoose.model("User", UserSchema);
