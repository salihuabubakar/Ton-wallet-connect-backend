# Architecture (short)
# Frontend
Frontend (React) — TonConnect to request user signature & wallet address; calls backend endpoints:

## Endpoints

- POST /auth to sign-in and register/save wallet address
- POST /checkin to record check-in (JWT required)
- GET /profile returns user's streak, hero_points, last_checkin, next eligible check-in
- GET /leaderboard returns top 10 users by hero_points

# Backend

Backend (Node.js + Express) — verifies wallet signature (challenge nonce), issues JWT, stores user in MongoDB, enforces check-in rules atomically.
DB (MongoDB via Mongoose) — user document with indexes for leaderboard.

## Endpoints

- POST /auth to sign-in and register/save wallet address
- POST /checkin to record check-in (JWT required)
- GET /profile returns user's streak, hero_points, last_checkin, next eligible check-in
- GET /leaderboard returns top 10 users by hero_points

## Security features

- Challenge nonces to prevent replay of signed messages
- Nonce TTL, single-use
- Rate-limiting, per-IP
- Atomic DB updates for checkins to prevent double-spend of streaks/points
- Validate server time & timestamps (avoid RPC manipulation)



# TON Network Wallet API Documentation

## Overview

Base URL (local dev): `http://localhost:5001`

**Authentication:** JWT token in `Authorization: Bearer <token>` header

---

## Endpoints

### 1. POST /auth/challenge

Generate a challenge message for wallet authentication.

**Request:**

```json
POST /auth/challenge
Content-Type: application/json

{
  "walletAddress": "EQC..."
}
```

**Response (200):**

```json
{
  "message": "TON Authentication\nWallet: EQC...\nNonce: <nonce>\nIssuedAt: <timestamp>",
  "nonce": "<nonce>"
}
```

**Notes:**
- Save the exact `message` text and request the wallet to sign it
- The `nonce` is single-use with a TTL of approximately 5 minutes
- Each challenge must be signed before the nonce expires

---

### 2. POST /auth/verify

Verify the signed challenge and return a JWT token.

**Request:**

```json
POST /auth/verify
Content-Type: application/json

{
  "walletAddress": "EQC...",
  "nonce": "<nonce>",
  "signature": "<signature (base64|hex|base58 depending on wallet)>",
  "publicKey": "<publicKey (base64|hex|base58)>"
}
```

**Response (200):**

```json
{
  "token": "<JWT>",
  "walletAddress": "EQC..."
}
```

**Errors:**
- `400` Invalid/expired nonce
- `401` Signature verification failed

---

### 3. GET /profile

Retrieve the authenticated user's profile information.

**Headers:**

```
Authorization: Bearer <JWT>
```

**Response (200):**

```json
{
  "walletAddress": "EQC...",
  "heroPoints": 120,
  "streak": 3,
  "lastCheckIn": "2025-11-20T14:10:00.000Z",
}
```

**Errors:**
- `401` Missing/invalid token
- `404` User not found

---

### 4. POST /checkin

Record a daily check-in for the authenticated user.

**Headers:**

```
Authorization: Bearer <JWT>
```

**Body:** None

**Response (200):**

```json
{
  "walletAddress": "EQC...",
  "streak": 4,
  "heroPoints": 130,
  "lastCheckIn": "2025-11-21T14:12:00.000Z"
}
```

**Errors:**
- `401` Unauthorized
- `429` Already checked in within 24 hours
- `500` Server error

**Notes:**
- Check-ins are recorded once per 24-hour period
- Successful check-ins award hero points and maintain streaks
- Server time is the source of truth for check-in validation

---

### 5. GET /leaderboard

Retrieve the top 10 users ranked by hero points (public endpoint).

**Response (200):**

```json
{
  "leaderboard": [
    { "walletAddress": "EQC123...", "heroPoints": 300, "streak": 12 },
    { "walletAddress": "EQC456...", "heroPoints": 280, "streak": 9 },
    { "walletAddress": "EQC789...", "heroPoints": 250, "streak": 7 }
  ]
}
```

---

## Common Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| `400` | Bad Request | Missing required fields or invalid format |
| `401` | Unauthorized | Missing/invalid JWT or signature verification failure |
| `429` | Too Many Requests | Rate-limited endpoint (too many requests in short time) |
| `500` | Internal Server Error | Server-side exception or database error |

---

## Authentication Flow

1. **Challenge:** Call `POST /auth/challenge` with wallet address → receive message + nonce
2. **Sign:** User signs the message with their private key
3. **Verify:** Call `POST /auth/verify` with signature + public key → receive JWT token
4. **Access:** Use JWT token in `Authorization: Bearer <token>` header for authenticated endpoints

---

## Rate Limiting

- Check-in endpoint: 1 request per 24 hours per wallet
- General rate limiting: Subject to server configuration
- Exceeding limits returns `429 Too Many Requests`

---

## Data Types

- **walletAddress:** TON wallet address (string, e.g., `EQC...`)
- **heroPoints:** Integer representing accumulated points
- **streak:** Integer representing consecutive daily check-ins
- **timestamp:** ISO 8601 format (e.g., `2025-11-20T14:10:00.000Z`)
- **JWT:** Bearer token for authentication
- **signature:** Base64, hex, encoded signature
- **publicKey:** Base64, hex, encoded public key