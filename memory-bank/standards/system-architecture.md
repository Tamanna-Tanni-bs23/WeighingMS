# System Architecture

## Overview
Single-process modular monolith using ports & adapters (hexagonal). WeighingMS domain logic sits in the centre; every external system — OrgaTEX, Scale, Scanner, Printer — is reached only through a port, with a Dummy adapter as the training-time implementation.

## Architecture Style
Ports & adapters modular monolith.

```text
React UI ──HTTP /api──► Express routes ──► Application use cases ──► Domain rules
                                                │
                                                ▼
                                   Ports (interfaces)
                     ┌──────────┬──────────┬──────────┬──────────┐
                  OrgatexPort ScalePort ScannerPort PrinterPort  Repositories
                     │          │          │          │          │
               Dummy OrgaTEX Dummy Scale Dummy Scan Dummy Print JSON store
```

Rationale: the brief requires OrgaTEX interaction confined to one replaceable adapter (IR-07); the same treatment for devices keeps the real-vs-dummy boundary explicit and lets tests drive failure states.

## API Design
REST over HTTP/JSON (details in `api-conventions.md`).

- Dummy external-system APIs are exposed under `/api/...` per the workbook training contracts (`/api/batches`, `/api/scales`, `/api/tickets`, ...). These are **training contracts**, not claims about the real OrgaTEX interface.
- The UI consumes data only through these APIs; no scenario data is hard-coded in UI components.

## State Management
- Server: authoritative for batch/component weighing state and transactions.
- Client: React state + a reducer per screen for the weighing state machine (idle → weighing → in-tolerance → confirmed / overshoot); live weight via polling the Scale API (default 250 ms).

## Caching Strategy
None. Single station, local process.

## Security Patterns
- Bind to `127.0.0.1` only.
- Validate all request bodies at the HTTP boundary (zod).
- No real credentials in the training build; adapter configs keep a place for them.

## Decision Relationships
- Ports align with repository pattern in `data-stack.md`.
- Dummy adapters expose control hooks (e.g. set scale offline, set simulated weight) used by Playwright failure tests.
