# ADR-0011: Deduplication of imported transactions by external ID

- **Status:** Accepted
- **Date:** 2026-05-13
- **Deciders:** Victor Pozzan
- **Tags:** backend, import, data-integrity

## Context and Problem Statement

Users import bank statements periodically. Statements overlap — a statement covering May and another covering April–June share transactions. Without deduplication, re-importing would create duplicate records and corrupt every balance and summary.

We need to reliably detect "this transaction has already been imported" across separate import operations.

## Considered Options

- Option A: Deduplicate by exact match on (date, amount, description)
- Option B: Deduplicate by a stable external ID stored per transaction
- Option C: No deduplication — let users manually clean up

## Decision Outcome

**Chosen option:** "Deduplicate by a stable external ID", because it gives each imported transaction a durable identity that survives across import operations, and the database can enforce uniqueness directly.

Implementation:

- The `Transaction` table has an `externalId` field with a `@@unique([userId, externalId])` constraint
- For OFX files, `externalId` comes from the bank's own `FITID` (Financial Institution Transaction ID) — a value the bank guarantees unique
- For CSV files, which have no native ID, `externalId` is synthesized as a SHA-256 hash of `date | description | amount`
- During preview, the service checks which `externalId` values already exist for the user and marks them as duplicates
- During commit, `createMany({ skipDuplicates: true })` lets the database reject any duplicate that slipped through between preview and commit

### Positive Consequences

- The database enforces uniqueness — no application-level race window
- OFX deduplication is exact and reliable thanks to `FITID`
- Re-importing an overlapping statement is safe — duplicates are detected, not inserted
- The preview step shows the user exactly what is new vs. already imported

### Negative Consequences

- CSV deduplication depends on a synthesized hash — two genuinely distinct transactions with identical date, description, and amount would be treated as duplicates (rare, but possible — e.g. two identical coffees on the same day)
- `externalId` couples the transaction record to its import origin
- A manually created transaction has no `externalId`, so it can't deduplicate against a later import of the same real-world transaction

## Pros and Cons of the Options

### Option A: Match on (date, amount, description)

- ✅ No extra field needed
- ✅ Works for any source, including manual entries
- ❌ No database-level uniqueness — must be checked in application code on every import
- ❌ Same fragility as the CSV hash, but for *all* transactions, not just CSV
- ❌ Slower — requires a compound query per transaction instead of an indexed ID lookup

### Option B: Stable external ID (chosen)

- ✅ Database-enforced uniqueness via a unique constraint
- ✅ Exact for OFX (uses the bank's own ID)
- ✅ Indexed lookups are fast
- ❌ CSV hash collisions possible for genuinely identical transactions
- ❌ Manual transactions have no external ID

### Option C: No deduplication

- ✅ Zero implementation cost
- ❌ Re-importing corrupts all balances — unacceptable for a finance app

## Future considerations

The CSV hash collision risk could be reduced by adding a sequence number for transactions that hash identically within the same file. For now, the risk is low enough that the simpler approach is acceptable, and the preview step gives users a chance to catch it manually.

## Links

- ADR-0010: Strategy Pattern for file parsers — explains where `externalId` is produced
- [OFX FITID specification](https://www.ofx.net/) — the bank-provided unique identifier