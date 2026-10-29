# Final Evidence — WeighingMS

Generated 2026-10-29. Test runs: **Vitest 42/42 passed**, **Playwright 11/11 passed**, `tsc --noEmit` clean.
Evidence files are in the evidence folder (`evidence/`); Playwright HTML report + videos in `playwright-report/`.

## Requirement traceability

| Requirement | UI | API | Code | Test | Evidence | Result |
|---|---|---|---|---|---|---|
| Batch queue (FR-1) | ✓ Screen 1 | ✓ `GET /api/batches` | `dummy/orgatex.ts`, `App.tsx` QueueView | API + E2E full flow | STEP-18-api-tests.txt, E2E-screen-1-select-batch.png | PASS |
| Batch selection (FR-2) | ✓ touch / scan | ✓ `GET /api/batches/:id`, `POST /api/station/session` | `station.start()` | API + E2E | E2E-screen-2-weigh.png | PASS |
| Recipe (FR-3) | ✓ rail | ✓ `GET /api/batches/:id/recipe` | seed `recipes.json` | API "five components" | STEP-17-dummy-data.json | PASS |
| Scale selection (FR-8) | ✓ badge "automatic" | ✓ `GET /api/scales` | `domain/scale-selection.ts` (config threshold) | 9 unit tests + E2E switch | E2E-scale-switch-32kg.png | PASS |
| Live weight (FR-9) | ✓ Weighed now (200 ms) | ✓ `GET /api/scales/:id/weight`, `/api/station/live` | `DummyScales.pour()` | E2E "simulated pour" | — | PASS |
| Tolerance (FR-12) | ✓ band, caption, colours | — (server re-validates) | `domain/tolerance.ts` | Step 22 table unit + E2E | STEP-22-tolerance-tests.txt | PASS |
| Lot tracking (FR-5) | ✓ meta line | ✓ in recipe + record | `station.record()` | API traceability test | STEP-25-transaction.json | PASS |
| Container / tare (FR-6, FR-7) | ✓ meta + Re-tare | ✓ `POST /api/scales/:id/tare` | `station.activate()/retare()` | API + E2E re-tare | STEP-25-transaction.json | PASS |
| Component progression (FR-16) | ✓ ✓/WEIGHING/PENDING | ✓ `/api/station/confirm` | `station.record()` next pending | E2E full flow | E2E videos | PASS |
| Overshoot (FR-14) | ✓ surplus panel + info proposal | ✓ `live.proposal` | `domain/surplus.ts`, ADR-001 | unit + E2E overshoot | STEP-24-overshoot-decision.md, E2E-overshoot.png | PASS |
| Supervisor override (FR-15) | ✓ dialog | ✓ `POST /api/station/override` | `station.override()` | API 403/400 + E2E | STEP-24-overshoot-decision.md | PASS |
| Confirmation (FR-13) | ✓ OK enabled in range only | ✓ 409 `OUT_OF_TOLERANCE` | `station.confirm()` | API + E2E | STEP-25-transaction.json | PASS |
| Batch completion (FR-18) | ✓ Screen 3 summary | ✓ 409 `BATCH_INCOMPLETE` | `station.complete()` | API + E2E | E2E-screen-3-confirm-print.png | PASS |
| OrgaTEX write-back (FR-19) | ✓ CONFIRMED / PENDING + Retry | ✓ `POST /api/batches/:id/consumption` → 200 | `station.writeBack()` | API + E2E (incl. outage) | STEP-26-writeback.txt | PASS |
| Ticket (FR-20) | ✓ preview + print / reprint | ✓ `POST /api/tickets` → 201 | `station.print()` | API + E2E | STEP-27-ticket.json, E2E-screen-3-confirm-print.png | PASS |
| Operator traceability (FR-21) | ✓ operator chip | ✓ `operatorId` on every record | config operators | API traceability test | STEP-25-transaction.json | PASS |
| Device status (FR-22) | ✓ status strip | ✓ `GET /api/health` | `StatusStrip` | E2E scale offline | — | PASS |

## Failure scenarios (Step 30)

| Scenario | Expected | Actual | Pass |
|---|---|---|---|
| Scale unavailable | Safe failure | "SCALE OFFLINE — WEIGHING PAUSED", OK disabled, no record, strip shows OFFLINE; API 503 | ✓ |
| OrgaTEX unavailable (queue) | Defined behaviour | "OrgaTEX unavailable" + Retry; loads after reconnect | ✓ |
| OrgaTEX unavailable (completion) | Defined behaviour | Records kept, write-back PENDING, Retry → CONFIRMED | ✓ |
| Printer unavailable | Defined behaviour | "Printer unavailable — …" notice, ticket kept in preview, write-back unaffected | ✓ |
| Invalid weight / over tolerance | Cannot confirm | OK disabled; API 409 OUT_OF_TOLERANCE | ✓ |
| Under tolerance | Cannot confirm | OK disabled at 93.4 g | ✓ |
| Re-tare | Weight reset | 500.0 g → 0.0 g | ✓ |
| Quit | Safe exit | Component back to pending, no record | ✓ |
| Incomplete batch | Cannot complete | API 409 BATCH_INCOMPLETE | ✓ |

## UI validation vs prototype (Step 28)

| Area | Match | Deviation (reason) |
|---|---|---|
| Screen 1 · Select batch | Scan prompt, table columns, tags | Status `QUEUED` for released; B-24187 starts fresh 0/5 (to demo full flow) |
| Screen 2 · Weigh | Rail, meta line, scale badge, 3 readouts, bar + band + target line, status line, surplus panel, OK/Re-tare/Quit/Override | Simulator bar moved inside the screen, labelled "Training simulator"; Override enabled only when over tolerance |
| Screen 3 · Confirm & print | Summary rows, write-back line, ticket layout, Print / Next | Shows PENDING + Retry when OrgaTEX down; "Reprint" + REPRINT marker |
| Chrome | Topbar, operator chip, status strip, clock | Strip is live from `/api/health`; operator selectable before a batch starts |
| Not reproduced | Facilitator notes, question pins, screen switcher | Prototype-only discussion aids; navigation is workflow-driven |

## Known deviations from standards

- ESLint/Prettier and pino were specified in `coding-standards.md` but not installed (time constraint); TypeScript strict is enforced, logging uses console.
- Dyestuff barcode scan shows verified/wrong notice but does not hard-block weighing (FR-4 "Should").
