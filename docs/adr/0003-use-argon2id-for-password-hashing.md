# ADR-0003: Use Argon2id for password hashing

- **Status:** Accepted
- **Date:** 2026-05-11
- **Deciders:** Victor Pozzan
- **Tags:** backend, security, auth

## Context and Problem Statement

Centavo stores user passwords, which must never be persisted in plaintext or reversible form. We need to choose a password hashing function that resists offline brute-force attacks, including GPU- and ASIC-based attacks, while remaining fast enough for interactive login.

## Considered Options

- Option A: bcrypt
- Option B: Argon2id
- Option C: PBKDF2

## Decision Outcome

**Chosen option:** "Argon2id", because it is the winner of the 2015 Password Hashing Competition and is the algorithm currently recommended by OWASP as the first choice for password storage. Argon2id provides resistance to both side-channel attacks (the `i` variant) and GPU-based attacks (the `d` variant) by combining both strategies.

Configuration follows OWASP's 2023 guidance for the `argon2id` profile:

- `memoryCost: 19456` (19 MB)
- `timeCost: 2`
- `parallelism: 1`

### Positive Consequences

- State-of-the-art resistance to offline cracking attacks
- Tunable memory cost makes GPU/ASIC attacks expensive
- Standardized via RFC 9106

### Negative Consequences

- Native binary dependency (`argon2` npm package compiles via node-gyp) — adds CI/Docker complexity
- Less ubiquitous in codebases than bcrypt — some interviewers will ask "why not bcrypt?"
- Verification is slightly slower than bcrypt at equivalent security levels

## Pros and Cons of the Options

### Option A: bcrypt

- ✅ Ubiquitous, present in essentially every web framework's tutorial
- ✅ Battle-tested since 1999
- ✅ No native compilation step required for some bindings
- ❌ Vulnerable to GPU and FPGA acceleration (no memory hardness)
- ❌ Maximum password length of 72 bytes — silent truncation can hide bugs
- ❌ No longer the OWASP first recommendation

### Option B: Argon2id

- ✅ OWASP first choice as of 2023
- ✅ Memory-hard — defeats GPU/ASIC speedups
- ✅ Configurable for present and future hardware
- ❌ Native compilation can fail on certain platforms (Windows without build tools)
- ❌ Requires explaining "why not bcrypt" in code review

### Option C: PBKDF2

- ✅ FIPS-approved — relevant in regulated environments
- ✅ No native code dependency
- ❌ Not memory-hard — weakest against modern GPU attacks
- ❌ OWASP only recommends as a fallback when Argon2 and bcrypt are unavailable

## Links

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 9106 — Argon2 Memory-Hard Function](https://datatracker.ietf.org/doc/rfc9106/)
- [Password Hashing Competition results](https://www.password-hashing.net/)