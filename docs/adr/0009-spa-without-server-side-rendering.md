# ADR-0009: Build a single-page application without server-side rendering

- **Status:** Accepted
- **Date:** 2026-05-12
- **Deciders:** Victor Pozzan
- **Tags:** frontend, architecture, deployment

## Context and Problem Statement

The Angular 21 CLI offers two starting points for new applications: a traditional client-side single-page application (SPA), and a server-side rendered (SSR) setup using `@angular/ssr` (formerly Angular Universal). The Nx generator we used initially produced an SSR-enabled project.

We need to decide whether to keep SSR or remove it before continuing development.

The decision matters because SSR is not a "free upgrade" — it adds a Node.js runtime to the deployment surface, requires SSR-safe code (no direct `window` or `document` access during rendering), and complicates routing, authentication, and data fetching.

## Considered Options

- Option A: Keep SSR enabled (@angular/ssr)
- Option B: Use static site generation (prerendering) for public pages, SPA for the rest
- Option C: Pure client-side SPA without SSR (chosen)

## Decision Outcome

**Chosen option:** "Pure client-side SPA without SSR", because the application's content is almost entirely behind authentication, has no SEO requirements, and removing SSR meaningfully simplifies the development and deployment surface.

### Positive Consequences

- Simpler mental model — every component runs in the browser, period
- Simpler deployment — static files behind any CDN or static host (Vercel, Cloudflare Pages, S3, etc.)
- No Node.js runtime needed for serving the frontend
- Faster development build times
- No risk of SSR/CSR hydration mismatches

### Negative Consequences

- Initial page load shows a loading state until the JS bundle parses and renders
- No HTML rendered before JS executes — crawlers see an empty shell (acceptable since the app is private)
- Login page does not benefit from SSR optimizations

## Pros and Cons of the Options

### Option A: Keep SSR (@angular/ssr)

- ✅ First contentful paint can be faster on slow networks
- ✅ Better SEO indexing for public pages
- ✅ Predictable initial render before hydration
- ❌ Requires a Node.js runtime in production
- ❌ Components must be SSR-safe (no DOM access outside platform checks)
- ❌ Authentication on SSR requires careful handling of tokens (cannot use localStorage during rendering)
- ❌ Hydration mismatches are a frequent source of subtle bugs

### Option B: Static site generation for public routes only

- ✅ Best of both worlds for marketing pages
- ❌ Requires splitting routing into prerenderable vs. dynamic
- ❌ Centavo has no marketing pages — every route requires authentication
- ❌ Adds build complexity for zero gain in this project

### Option C: Pure SPA (chosen)

- ✅ Smallest deployment surface — static files only
- ✅ Simplest development experience
- ✅ Matches what the application actually needs
- ❌ Initial paint shows a brief loading state
- ❌ Not crawler-friendly — acceptable for a private app

## Future considerations

If Centavo ever grows a public marketing site, a separate static site (built with Astro, Eleventy, or Next.js) would serve that surface. The authenticated app would remain a pure SPA. Mixing the two in a single Angular project is not worth the complexity.

## Links

- [Angular SSR documentation](https://angular.dev/guide/ssr)
- ADR-0007: Token storage strategy in the browser — explains why localStorage is involved, which conflicts with SSR-friendly auth patterns