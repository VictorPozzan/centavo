# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Centavo project. We use the [MADR](https://adr.github.io/madr/) format.

## What is an ADR?

An ADR captures an important architectural decision made along with its context and consequences. We write ADRs to:

- Make trade-offs explicit instead of implicit
- Onboard new contributors without losing context
- Justify decisions that aren't obvious from the code

## When to write an ADR

Write an ADR when a decision:

- Has long-term impact on the codebase
- Involves a real trade-off (not a convention or no-brainer)
- Would be questioned by a future developer reading the code
- Constrains future implementation choices

Do **not** write an ADR for:

- Style preferences (Prettier, ESLint rules)
- Naming conventions
- Industry-standard choices with no realistic alternatives

## How to write a new ADR

1. Copy `template.md` to `NNNN-short-title.md` (4-digit sequential number, kebab-case)
2. Fill in all sections
3. Set status to `Proposed`
4. Open a PR
5. Change status to `Accepted` when merged

If a decision is later replaced, mark the old ADR as `Superseded by ADR-XXXX` instead of deleting it. ADRs are immutable history.

## Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [0001](./0001-use-nx-monorepo-structure.md) | Use Nx monorepo structure | Accepted | 2026-05-11 |
| [0002](./0002-use-prisma-as-orm.md) | Use Prisma as the ORM | Accepted | 2026-05-11 |
| [0003](./0003-use-argon2id-for-password-hashing.md) | Use Argon2id for password hashing | Accepted | 2026-05-11 |
| [0004](./0004-rotating-refresh-tokens-with-sha256.md) | Rotating refresh tokens hashed with SHA-256 | Accepted | 2026-05-11 |
| [0005](./0005-query-level-user-isolation.md) | Query-level user isolation | Accepted | 2026-05-12 |
| [0006](./0006-signals-for-state-management.md) | Signals for state management in Angular | Accepted | 2026-05-12 |
| [0007](./0007-token-storage-strategy.md) | Token storage strategy in the browser | Accepted | 2026-05-12 |
| [0008](./0008-no-ui-component-library.md) | Build UI components in-house instead of adopting a library | Accepted | 2026-05-12 |
| [0009](./0009-spa-without-server-side-rendering.md) | Build a single-page application without server-side rendering | Accepted | 2026-05-12 |
| [0010](./0010-strategy-pattern-for-file-parsers.md) | Strategy Pattern for transaction file parsers | Accepted | 2026-05-13 |
| [0011](./0011-deduplication-by-external-id.md) | Deduplication of imported transactions by external ID | Accepted | 2026-05-13 |

## Architecture Decisions

Major architectural decisions are documented as [Architecture Decision Records](./docs/adr/README.md) (ADRs). Some highlights:

- [ADR-0001](./docs/adr/0001-use-nx-monorepo-structure.md) — Why Nx instead of two repos or a folder-based monorepo
- [ADR-0002](./docs/adr/0002-use-prisma-as-orm.md) — Why Prisma instead of TypeORM
- [ADR-0003](./docs/adr/0003-use-argon2id-for-password-hashing.md) — Why Argon2id instead of bcrypt
- [ADR-0004](./docs/adr/0004-rotating-refresh-tokens-with-sha256.md) — Why rotating refresh tokens hashed with SHA-256
- [ADR-0005](./docs/adr/0005-query-level-user-isolation.md) — Why query-level user isolation instead of RLS or Prisma extensions
- [ADR-0006](./docs/adr/0006-signals-for-state-management.md) — Why signals over RxJS BehaviorSubject for state
- [ADR-0007](./docs/adr/0007-token-storage-strategy.md) — Why access token in memory + refresh in localStorage
- [ADR-0008](./docs/adr/0008-no-ui-component-library.md) — Why no Angular Material or PrimeNG
- [ADR-0009](./docs/adr/0009-spa-without-server-side-rendering.md) — Why pure SPA without SSR
- [ADR-0010](./docs/adr/0010-strategy-pattern-for-file-parsers.md) — Why Strategy Pattern for the import parsers
- [ADR-0011](./docs/adr/0011-deduplication-by-external-id.md) — Why deduplication by external ID