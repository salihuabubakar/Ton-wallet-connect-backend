import mongoose from "mongoose";

const NonceSchema = new mongoose.Schema({
  walletAddress: String,
  nonce: String,
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

export default mongoose.model("Nonce", NonceSchema);
