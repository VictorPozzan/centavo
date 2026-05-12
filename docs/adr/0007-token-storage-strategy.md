# ADR-0007: Token storage strategy in the browser

- **Status:** Accepted
- **Date:** 2026-05-12
- **Deciders:** Victor Pozzan
- **Tags:** frontend, security, auth

## Context and Problem Statement

The Centavo frontend receives a short-lived access token (15 min) and a long-lived refresh token (7 days) after login. We need to decide where to store each token, balancing security against UX. Users expect to remain logged in across page reloads.

The threat model considers two primary attacks:

- **XSS** — malicious script injected into the application can read anything in `localStorage`, `sessionStorage`, or in-memory variables of the running JS context
- **CSRF** — attacker tricks the user's browser into making authenticated requests; only relevant for cookies sent automatically

## Considered Options

- Option A: Both tokens in `localStorage`
- Option B: Both tokens in `httpOnly` cookies
- Option C: Access token in memory + refresh token in `localStorage` (chosen)
- Option D: Access token in memory + refresh token in `httpOnly` cookie

## Decision Outcome

**Chosen option:** "Access token in memory + refresh token in localStorage", because it provides reasonable XSS mitigation for the high-value token (access) while keeping the implementation simple and backend-agnostic.

Key reasoning:

- Access tokens are short-lived; keeping them in memory limits the XSS exfiltration window to a single session
- Refresh tokens in `localStorage` are vulnerable to XSS, but the backend rotates them on every use and detects reuse (see ADR-0004), shortening the practical exploitation window
- Cookies would require backend changes (cookie middleware, CSRF protection) and tie the frontend tightly to a same-origin deployment — incompatible with potential future deployments where API and SPA live on different domains

### Positive Consequences

- Access token cannot be read by XSS across page reloads (it's not persisted)
- Implementation works regardless of API/SPA deployment topology
- No CSRF protection needed (no cookies sent automatically)
- Logout works cleanly (clear in-memory + clear localStorage)

### Negative Consequences

- Refresh token in localStorage remains XSS-readable — mitigated but not eliminated
- Page refresh requires a silent refresh round-trip to recover the access token (adds ~100-300ms to first authenticated request)
- Multiple tabs each maintain their own access token instance

## Pros and Cons of the Options

### Option A: Both in localStorage

- ✅ Simplest implementation
- ✅ Persists across reloads with no extra request
- ❌ Both tokens fully exposed to XSS
- ❌ Stolen access token usable for full 15 minutes with no detection

### Option B: Both in httpOnly cookies

- ✅ XSS cannot read the tokens directly
- ❌ Requires backend cookie handling and CSRF protection (double-submit token or SameSite=Strict)
- ❌ Couples frontend to same-origin deployments
- ❌ Logout requires backend cooperation to clear cookies

### Option C: Access in memory + refresh in localStorage (chosen)

- ✅ High-value token (access) protected from cross-session XSS
- ✅ Simple implementation
- ✅ Works across deployment topologies
- ❌ Refresh token still XSS-readable
- ❌ Refresh round-trip on page reload

### Option D: Access in memory + refresh in httpOnly cookie

- ✅ Best-in-class XSS resistance
- ✅ Logout can clear cookie server-side
- ❌ Most complex to implement (CORS + credentials + CSRF)
- ❌ Couples to same-origin or carefully configured CORS

## Future considerations

If Centavo deploys with API and SPA on the same origin and CSRF protection in place, migrating to Option D would meaningfully improve XSS resistance. Until then, Option C is a reasonable middle ground.

## Links

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- ADR-0004: Rotating refresh tokens — explains the backend defense against token theft
- [Auth0: Where to store tokens](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)