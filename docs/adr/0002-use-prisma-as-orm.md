# ADR-0002: Use Prisma as the ORM

- **Status:** Accepted
- **Date:** 2026-05-11
- **Deciders:** Victor Pozzan
- **Tags:** backend, database, orm

## Context and Problem Statement

The NestJS backend needs an Object-Relational Mapper to interact with PostgreSQL. The choice impacts developer experience, type safety, migration workflow, and how easy it is to onboard contributors familiar with the broader NestJS ecosystem.

## Considered Options

- Option A: TypeORM
- Option B: Prisma
- Option C: Drizzle ORM

## Decision Outcome

**Chosen option:** "Prisma", because of its superior developer experience (auto-generated, fully-typed client; declarative migration tooling; Prisma Studio for visual inspection) and its growing adoption in modern Node.js stacks. The decision favors developer ergonomics and a strong learning experience over alignment with the most common ORM in legacy NestJS codebases.

### Positive Consequences

- Auto-generated, fully-typed query client — no manual entity wiring
- Schema-first workflow is easier to review and onboard
- Excellent migration tooling out of the box
- Prisma Studio speeds up local debugging
- Schema doubles as documentation

### Negative Consequences

- Slightly less ubiquitous in NestJS job postings than TypeORM (still common, but TypeORM is dominant in older codebases)
- Less control over generated SQL for complex queries — escape hatch via `$queryRaw` exists but defeats type safety
- The Rust query engine adds a binary dependency at runtime
- Prisma 7 (released late 2025) introduced breaking changes to schema config; we pinned to v6 deliberately (see migration history)

## Pros and Cons of the Options

### Option A: TypeORM

- ✅ Most common ORM in NestJS job postings — strong signal for hiring
- ✅ Mature, battle-tested for years
- ✅ Supports both Active Record and Data Mapper patterns
- ❌ Verbose entity definitions with heavy decorator usage
- ❌ Migration tooling is less polished than Prisma's
- ❌ Type inference is weaker — query builders return `any` more often than they should

### Option B: Prisma

- ✅ Best-in-class TypeScript inference
- ✅ Declarative schema and migrations
- ✅ Excellent CLI and Studio tooling
- ❌ Less code-level control over the SQL emitted
- ❌ Slightly hyped — could lose momentum to alternatives over 5+ year horizons

### Option C: Drizzle ORM

- ✅ Closer to raw SQL with full type safety
- ✅ Lightweight, no query engine
- ❌ Smaller ecosystem and community
- ❌ Less familiar to interviewers — adds friction without strategic upside
- ❌ Already used in another portfolio project (`brevly`); duplicating reduces signal

## Links

- [Prisma documentation](https://www.prisma.io/docs)
- [Why Prisma over TypeORM (Prisma's comparison)](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-typeorm) — biased source, treat as advocacy