# ADR-0001: Use Nx monorepo structure

- **Status:** Accepted
- **Date:** 2026-05-11
- **Deciders:** Victor Pozzan
- **Tags:** infra, tooling, monorepo

## Context and Problem Statement

Centavo needs both a backend (NestJS API) and a frontend (Angular SPA), with shared TypeScript types between them (DTOs, enums, response shapes). We need to decide how to organize these projects: separate repositories, a simple multi-folder repository, or a managed monorepo.

The shared-types problem is real: every endpoint contract needs to be consistent between server and client, and we want IDE-level safety, not runtime hope.

## Considered Options

- Option A: Two separate repositories (`centavo-api`, `centavo-web`)
- Option B: Simple monorepo with two folders and independent `package.json` per app (like the `brevly` project)
- Option C: Nx-managed monorepo with apps and libs

## Decision Outcome

**Chosen option:** "Nx monorepo", because it gives us first-class support for shared libraries between Angular and NestJS, dependency-graph-aware builds, and an enterprise-style structure that scales if the project grows (workers, mobile app, admin panel).

### Positive Consequences

- Shared `libs/shared-types` is type-safe at compile time across both apps
- `nx affected` only builds/tests what changed — fast CI when the project grows
- Standard project structure familiar to engineers from larger codebases
- Generators (`nx g`) keep new modules consistent

### Negative Consequences

- Steeper learning curve than two folders + manual symlinks
- One more tool to upgrade (Nx itself ships breaking changes)
- Overkill for a solo project of this size — accepted intentionally for portfolio value

## Pros and Cons of the Options

### Option A: Two separate repositories

- ✅ Smallest possible learning curve
- ✅ Fully independent CI/CD pipelines
- ❌ Shared types must be published as a private npm package or duplicated
- ❌ Atomic changes spanning API and Web require coordinated PRs across repos
- ❌ Harder to onboard a new contributor (clone two repos, configure both)

### Option B: Simple monorepo (folders only)

- ✅ Zero tooling overhead
- ✅ Easy to reason about — each folder is its own world
- ❌ Shared types require relative imports across folders, which TS handles poorly
- ❌ No build orchestration: developer must remember what to rebuild
- ❌ Already used in another portfolio project (`brevly`); duplicating reduces signal

### Option C: Nx monorepo

- ✅ Native support for cross-app shared libraries (`@centavo/shared-types`)
- ✅ Affected graph optimizes CI as the project grows
- ✅ Code generators ensure consistency
- ❌ Higher cognitive load up front
- ❌ Lock-in to Nx tooling for project lifecycle

## Links

- [Nx documentation](https://nx.dev)
- Previous project using simple monorepo: [VictorPozzan/brevly](https://github.com/VictorPozzan/brevly)