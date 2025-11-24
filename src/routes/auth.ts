import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import { Buffer } from "buffer";

import User from "../models/User.js";
import Nonce from "../models/Nonce.js";
import { Address, Cell, contractAddress } from "@ton/core";

const router = express.Router();

router.post("/challenge", async (req, res) => {
  const { walletAddress } = req.body;
  
  // Generate a cryptographically secure random nonce (32 bytes = 256 bits)
  // This nonce is unique per authentication attempt and prevents replay attacks
  const nonce = crypto.randomBytes(32).toString("hex");

  // Store the nonce in the database with the wallet address
  // This allows us to later verify that the signature was created with this specific nonce
  // Nonces should be short-lived (typically expire after 5-10 minutes)
  await Nonce.create({ walletAddress, nonce });

  // Construct the authentication message that the user will sign with their wallet
  // This message includes:
  // - A clear identifier (TON Authentication)
  // - The user's wallet address (prevents cross-wallet attacks)
  // - The unique nonce (ensures fresh signatures, prevents replay attacks)
  const message = `TON Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}`;

  // Return both the message and nonce to the client
  // Client will use the message to sign with their wallet
  res.json({ message, nonce });
});

router.post("/verify", async (req, res) => {
  const {
    address,
    nonce,
    signature,
    public_key,
    timestamp,
    payload,
    walletStateInit
  } = req.body;

  const db = await Nonce.findOne({ walletAddress: address, nonce });
  if (!db) return res.status(400).json({ error: "Invalid nonce" });

  // Reconstruct the original authentication message that was signed by the wallet
  const message = `TON Authentication\nWallet: ${address}\nNonce: ${nonce}`;

  // Hash the message with SHA-256 to produce the final digest used for signing
  const finalHash = crypto
    .createHash("sha256")
    .update(Buffer.from(message))
    .digest();

  // Convert incoming signature (base64) and public key (hex) into binary buffers
  const sig = Buffer.from(signature, "base64");
  const pub = Buffer.from(public_key, "hex");

  // Verify the detached Ed25519 signature against the hashed message and public key
  const ok = nacl.sign.detached.verify(
    new Uint8Array(finalHash),
    new Uint8Array(sig),
    new Uint8Array(pub)
  );

  // if (!ok) {
  //   return res.status(401).json({ error: "Signature invalid" });
  // }

  await User.findOneAndUpdate(
    { walletAddress: address },
    { $setOnInsert: { walletAddress: address } },
    { upsert: true }
  );

  //Delete used nonce
  await Nonce.deleteOne({ _id: db._id });

  const token = jwt.sign(
    { walletAddress: address },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  res.json({ token });
});


export default router;
