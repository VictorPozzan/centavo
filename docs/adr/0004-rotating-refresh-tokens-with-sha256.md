# ADR-0004: Rotating refresh tokens hashed with SHA-256

- **Status:** Accepted
- **Date:** 2026-05-11
- **Deciders:** Victor Pozzan
- **Tags:** backend, security, auth

## Context and Problem Statement

Centavo uses JWT access tokens for authenticating API requests. Access tokens are short-lived (15 minutes) to limit the impact of leakage, which requires a refresh mechanism so users don't need to log in every 15 minutes. The refresh mechanism itself is sensitive: a stolen refresh token grants long-term access if not protected.

We need to decide:

1. How refresh tokens are stored
2. Whether they are single-use (rotating) or reusable
3. How to detect and respond to refresh token theft

## Considered Options

- Option A: Stateless refresh tokens (JWT-based, not stored server-side)
- Option B: Stored refresh tokens with single-use rotation, hashed at rest
- Option C: Stored refresh tokens without rotation, hashed at rest

## Decision Outcome

**Chosen option:** "Stored refresh tokens with single-use rotation, hashed at rest", because it is the only option that allows the server to detect token theft and respond by invalidating all sessions for the affected user.

Implementation details:

- Refresh tokens are random UUIDs generated server-side
- Tokens are hashed with SHA-256 before being stored — the raw token is sent to the client only once
- Each refresh request rotates the token: the old one is marked revoked, a new one is issued
- If a revoked refresh token is presented again, all active sessions for the user are revoked (theft response)
- The `RefreshToken` table tracks `replacedBy` for forensic visibility

SHA-256 (rather than bcrypt/argon2) is intentional: refresh tokens are random 128-bit values, not user-chosen passwords. We need O(1) lookups by token hash, which requires a deterministic hash. There is no offline dictionary attack to defend against because the token has no semantic content to guess.

### Positive Consequences

- Stolen refresh tokens are detectable on second use
- Server-side revocation works (real logout, ban capability)
- Token at rest is useless if the database leaks
- Forensic trail via `replacedBy` chains

### Negative Consequences

- Requires a database round-trip per refresh (stateful auth)
- Migration to multi-region deployment will need a shared session store
- More moving parts than a stateless JWT-only approach

## Pros and Cons of the Options

### Option A: Stateless refresh tokens (JWT)

- ✅ No database lookup on refresh — scales horizontally with no shared state
- ✅ Simplest implementation
- ❌ Cannot revoke a leaked token without rotating the signing secret (logs out all users)
- ❌ Cannot detect token theft — a stolen token is indistinguishable from a legitimate one until expiry

### Option B: Stored + rotating + hashed (chosen)

- ✅ Theft detection via reuse signal
- ✅ Real revocation possible
- ✅ Hashed at rest protects against database leaks
- ❌ Stateful — requires DB on every refresh
- ❌ Race condition possible if client retries during rotation (mitigated by client-side queuing)

### Option C: Stored + non-rotating + hashed

- ✅ Simpler client logic (no token swap)
- ✅ Real revocation possible
- ❌ No theft detection — a leaked token can be used indefinitely until expiry
- ❌ Same DB cost as rotating without the security benefit

## Links

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 6819 — OAuth 2.0 Threat Model](https://datatracker.ietf.org/doc/html/rfc6819) — section on refresh token theft
- Auth0 blog: ["Refresh Token Rotation"](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- ADR-0003: Use Argon2id for password hashing — explains why we use a different hash for passwords vs tokens