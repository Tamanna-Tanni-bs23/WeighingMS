---
adr: 001
title: Overshoot / surplus handling (training build)
status: accepted
date: 2026-10-29T15:05:00Z
bolt: 004-weighing-station
unit: 003-weighing-station
decided_by: human (workbook Step 24)
---

# ADR-001: Overshoot / surplus handling

## Context

**Observed problem.** An operator can pour past the upper tolerance limit (e.g. Yellow RGB 96.4 g against 94.0 ±0.5 g → surplus +2.4 g, +2.6 %). The weighing must not be recorded as successful.

**What is known**
- project-requirement §6 Step 6–7: overweight → warn the operator; an unsuccessful weighing must not be recorded as successful "without an explicit, authorised exception".
- brief FR-20/FR-23/FR-24: detect over-dose, calculate surplus; offer supervisor override or discard-and-re-weigh; record override with authorising user and reason.
- brief §5.2: recipe authoring/modification is **out of scope** — recipes are owned by OrgaTEX.

**What is assumed (not confirmed)**
- brief A-08 / FR-21–22: "surplus compensation" = proportional recalculation of remaining components to preserve shade ratio. The brief itself calls this "the most likely misunderstanding in the document"; the prototype labels it "Proposal".

## Options considered

1. **Block and recover** — Confirm blocked; Re-tare (discard & re-weigh) or supervisor override with reason (logged `OVERRIDE`). No recalculation.
2. **Option 1 + information-only proposal** — additionally show the proportionally recalculated targets for remaining components, without applying them.
3. **Apply proportional recalculation** — after an accepted overshoot, scale remaining targets.

## Decision

**Option 2** (chosen by the human at Step 24).

Training rule: *An over-tolerance component remains unconfirmed. The operator must Re-tare and re-weigh, or a supervisor must accept the weight with a mandatory reason, which is recorded as `OVERRIDE` with supervisor ID and reason on the transaction, the OrgaTEX write-back and the ticket. While over tolerance, the surplus panel shows the targets that would preserve the shade ratio for the remaining components (factor = 1 + surplus %) for information only. WeighingMS never changes recipe targets.*

## Implementation

- `src/server/domain/tolerance.ts` — OVER zone, surplus and surplus %.
- `src/server/domain/surplus.ts` — `proportionalProposal()` (information only).
- `src/server/application/station.ts` — `confirm()` rejects OVER with `409 OUT_OF_TOLERANCE`; `override()` requires supervisor flag (403) and reason (400); `live()` returns `proposal`.
- `src/client/App.tsx` — surplus panel with proposal table and "not applied" note; Supervisor override dialog.

## Tests

- Unit: surplus +2.4 g / +2.6 %; proposal 24.000 → 24.624 kg, 9.600 → 9.850 kg (matches prototype).
- API: override rejected for non-supervisor (403) and blank reason (400).
- E2E: overshoot blocks confirm and shows proposal while rail targets stay unchanged; supervisor override records `OVERRIDE`, supervisor and reason.

## Consequences

- Safe: no out-of-tolerance weighing without an authorised, logged exception; recipe ownership respected.
- When FCI answers Q25/Q26 (A-08), only `surplus.ts` and the override path change.
