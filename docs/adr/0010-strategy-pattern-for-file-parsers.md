# ADR-0010: Strategy Pattern for transaction file parsers

- **Status:** Accepted
- **Date:** 2026-05-13
- **Deciders:** Victor Pozzan
- **Tags:** backend, architecture, import, design-pattern

## Context and Problem Statement

Centavo lets users import transactions from external files. Two formats are supported at launch — CSV and OFX/QFX — and more may be added later (PDF bank statements, proprietary bank formats, etc.).

Each format requires fundamentally different parsing logic: CSV needs delimiter and number-format detection, OFX needs XML traversal. But the rest of the import pipeline — deduplication, categorization, persistence — should not care which format produced the transactions.

We need a structure that isolates per-format logic while keeping the pipeline format-agnostic.

## Considered Options

- Option A: A single parser service with conditional branching (`if format === 'csv' ... else if ...`)
- Option B: Strategy Pattern — a `TransactionParser` interface with one implementation per format
- Option C: A parser factory that instantiates the right parser per request

## Decision Outcome

**Chosen option:** "Strategy Pattern", because it isolates each format's logic in its own class, makes adding a new format a closed operation (no existing code changes), and produces naturally testable units.

Implementation:

- `TransactionParser` interface defines `canHandle(fileName, content)` and `parse(content)`
- `CsvParser` and `OfxParser` each implement it
- A NestJS DI provider (`TRANSACTION_PARSERS` token) exposes the list of all parsers
- `ImportService` receives the list and picks the first parser whose `canHandle` returns true
- All parsers normalize their output to the same `ParsedTransaction` shape

### Positive Consequences

- Adding a new format means adding one class and registering it — no changes to `ImportService`, deduplication, or categorization (Open/Closed Principle)
- Each parser is unit-tested in isolation with format-specific edge cases
- The import pipeline works against the `ParsedTransaction` abstraction, never against raw file content
- `canHandle` lets parsers self-select based on both filename and content sniffing

### Negative Consequences

- More files and indirection than a single branching service
- The `ParsedTransaction` shape is a lowest common denominator — format-specific richness (e.g. OFX's `FITID`) must fit into the shared shape or be dropped
- Parser selection order matters when two parsers could both handle a file (currently not an issue, but a latent risk)

## Pros and Cons of the Options

### Option A: Single service with conditional branching

- ✅ Fewer files, everything in one place
- ✅ Simple to follow for two formats
- ❌ Grows into a long branching method as formats are added
- ❌ Format-specific logic is interleaved — hard to test one format without the others
- ❌ Adding a format means editing the core service (violates Open/Closed)

### Option B: Strategy Pattern (chosen)

- ✅ Each format isolated and independently testable
- ✅ Adding a format is a closed operation
- ✅ Pipeline depends on an abstraction, not concrete formats
- ❌ More indirection and files
- ❌ Shared output shape constrains format-specific detail

### Option C: Parser factory

- ✅ Also isolates format logic per class
- ❌ A factory that maps format → parser still needs editing when formats are added
- ❌ `canHandle` content-sniffing is more flexible than a format-string lookup
- ❌ In practice it's Strategy with an extra construction step — no added value here

## Links

- [Strategy Pattern — Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- ADR-0011: Deduplication by external ID — explains how the normalized output is deduplicated