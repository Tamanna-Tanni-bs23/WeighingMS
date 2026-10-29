# Data Stack

## Overview
No database server. Dummy external-system data is seeded from JSON files; WeighingMS's own records (weighing transactions, consumption write-backs, tickets) are persisted to JSON files through a repository interface, so they can be shown directly as evidence and swapped for a real store later.

## Database
JSON file store (local filesystem).

- Seed data: `src/server/dummy/data/*.json` (batches, recipes, components, scales, operators) — derived from the supplied prototype scenario (batch B-24187 etc.).
- Runtime records: `data/runtime/*.json` (transactions, consumption posts received by Dummy OrgaTEX, printed tickets). Git-ignored; resettable via a `npm run reset-data` script.

Rationale: training scale, single station, no install step; records are human-readable for Steps 25–26 evidence. Offline-with-deferred-sync (Product Brief) is modelled at the repository level, not by the storage engine.

## ORM / Database Client
None. Thin typed repository classes (`*Repository`) behind interfaces, using `fs/promises` with atomic write (write temp file → rename).

Rationale: avoids ORM overhead; the repository interface lets a later bolt replace JSON with SQLite (`node:sqlite`) or a real DB without touching domain code.

## Decision Relationships
- Repository interfaces align with ports & adapters in `system-architecture.md`.
- Dummy API state lives in the Dummy adapters' own stores, separate from WeighingMS's records — mirroring the real ownership boundary (OrgaTEX owns batches/recipes; WeighingMS owns weighing transactions).
