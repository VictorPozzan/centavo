# ADR-0005: Query-level user isolation

- **Status:** Accepted
- **Date:** 2026-05-12
- **Deciders:** Victor Pozzan
- **Tags:** backend, security, data-isolation

## Context and Problem Statement

Centavo is a multi-user system. Each user must only access their own accounts, categories, and transactions. A bug or oversight that allows one user to read or modify another user's data would be a severe security incident.

We need a strategy to enforce data isolation that is reliable, testable, and explicit enough to survive code reviews.

## Considered Options

- Option A: Query-level filtering — every service method receives `userId` and includes it in `where` clauses
- Option B: PostgreSQL Row-Level Security (RLS) — database policies enforce isolation, application sets the session user
- Option C: Prisma Client Extensions — middleware injects `userId` automatically into all queries

## Decision Outcome

**Chosen option:** "Query-level filtering", because it is the most explicit, easiest to reason about during code review, and matches how reviewers and interviewers expect to see isolation implemented in a NestJS + Prisma project.

The pattern is consistent across all services:

- `create`: `data: { ...dto, userId }`
- `findMany`: `where: { userId, ...filters }`
- `findOne`: `findFirst({ where: { id, userId } })` (note: `findFirst`, not `findUnique`, to make ownership part of the lookup)
- `update`/`delete`: fetch with ownership check first, then operate by ID

Cross-resource references (a transaction referencing an account or category) are validated via `assertOwnership` helpers before persistence.

### Positive Consequences

- Isolation is visible in every query — no hidden magic
- Easy to write unit tests that verify isolation (mock returns `null` and assert `NotFoundException`)
- Works identically with any ORM or raw SQL — not coupled to Prisma's internals
- Familiar pattern for any NestJS reviewer

### Negative Consequences

- Repetitive — `userId` appears in every service method
- A forgotten filter is a silent vulnerability — relies on developer discipline + tests
- Doesn't defend against bugs in raw SQL queries (`$queryRaw`)

## Pros and Cons of the Options

### Option A: Query-level filtering (chosen)

- ✅ Explicit and reviewable
- ✅ ORM-agnostic
- ✅ Easy to test
- ❌ Relies on developer discipline
- ❌ Silent failure mode if a filter is forgotten

### Option B: PostgreSQL Row-Level Security

- ✅ Defense-in-depth — even a buggy query cannot leak data
- ✅ Enforced at the lowest layer
- ❌ Adds operational complexity (policies in migrations, session variables)
- ❌ Harder to debug — silent denials instead of explicit errors
- ❌ Prisma support for RLS requires setting session variables per request, which complicates connection pooling
- ❌ Unusual in NestJS + Prisma stacks — would surprise reviewers

### Option C: Prisma Client Extensions

- ✅ DRY — `userId` injected automatically
- ✅ Single source of truth
- ❌ Extension behavior is implicit — easy to misunderstand in code review
- ❌ Requires per-request `PrismaClient` instances (request-scoped DI), which adds complexity
- ❌ Debugging is harder when queries don't behave as the literal code suggests

## Future considerations

If Centavo grows to handle highly sensitive data or multi-tenant deployments, layering PostgreSQL RLS on top of query-level filtering as defense-in-depth would be the natural next step. Until then, the explicit pattern + comprehensive unit tests is sufficient.

## Links

- [PostgreSQL Row-Level Security docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma Client Extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions)
- ADR-0002: Use Prisma as the ORM