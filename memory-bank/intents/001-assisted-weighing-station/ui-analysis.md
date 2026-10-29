---
intent: 001-assisted-weighing-station
phase: inception
source: docs/customize-weighing-station.html
created: 2026-10-29T14:31:22Z
---

# UI/UX Analysis — customize-weighing-station.html

Functional reading of the prototype. **Not a redesign.** Line refs are to `docs/customize-weighing-station.html`.

## 1. Screen inventory

| # | View id | Title | Purpose |
|---|---------|-------|---------|
| 1 | `v-queue` | 1 · Select batch | "Scan a batch card to begin — or touch a row below"; batch queue table |
| 2 | `v-weigh` | 2 · Weigh | Recipe rail (left) + weighing panel (right) + action bar |
| 3 | `v-done` | 3 · Confirm & print | Completion summary, OrgaTEX write-back status, ticket preview |
| — | chrome | Header + status bar | Station, batch context, operator, device states, clock |
| — | facilitator | "How to run this in the meeting", pinned questions | **Prototype-only**; not reproduced |

View switching in the prototype is a segmented control (`.seg button[data-view]`) — a demo aid. In the product, navigation is driven by workflow state (select → weigh → done).

## 2. UI components

| Component | Screen | Content |
|-----------|--------|---------|
| Header | all | `WeighingMS STATION 01`; `BATCH B-24187 · ORDER SO-9931 · MACHINE JET-04`; `Operator R. Karim · Shift A` |
| Queue table | 1 | Columns: Batch, Order, Machine, Fabric / lot, Shade, Comp., Status (`WEIGHING`/`QUEUED`); note "Queue received from OrgaTEX at 06:12" |
| Recipe rail | 2 | `Recipe · Teal 4C`, batch id, "n of 5 components weighed"; per-component button: swatch colour, name, code · scale, target qty + unit, state text |
| Component header | 2 | Name; `CODE · LOT · CONTAINER · TARE` meta line |
| Scale cell | 2 | `Scale selected` → `3 kg precision` / `32 kg floor`, tag `automatic` |
| Readouts | 2 | `Weighed now` (live), `Still to weigh`, `Target` — each with unit |
| Progress bar | 2 | Fill = weight / display max; tolerance band; target line; caption `TOLERANCE ±x u (min – max)`; right caption = display max (125 g / 32 kg …) |
| Status line | 2 | `DISPENSE — x REMAINING` / `WITHIN TOLERANCE — PRESS OK TO CONFIRM` / `OVER TOLERANCE — SURPLUS +x` / `OVERRIDE REQUESTED — AWAITING SUPERVISOR` |
| Surplus panel | 2 | `Surplus +2.4 g (+2.6%) — over tolerance`; recalculated remaining targets (`Sodium Sulphate 24.000 kg → 24.624 kg`, `Soda Ash 9.600 kg → 9.850 kg`); "Proposal: recalculate the remaining components to preserve the shade ratio." |
| Action bar | 2 | `OK · Confirm F1`, `Re-tare F2`, `Quit F4`, `Supervisor override` |
| Simulator | 2 | `Simulate dispense`, `Simulate overshoot`, `Reset` (demo controls) |
| Summary | 3 | `Batch B-24187 weighed`; Components weighed 5 of 5; All within tolerance YES; Total dispensed 35.322 kg; Elapsed 6 min 41 s; Operator |
| Write-back | 3 | `Written to OrgaTEX CONFIRMED 07:48:22`; "Actual consumption posted against the batch. Container released for transport to JET-04." |
| Ticket | 3 | `FCI DYEING — WEIGHING TICKET`; BATCH, ORDER, MACHINE, SHADE, DATE, OPER.; COMPONENT / TGT / ACT lines; `ALL WITHIN TOLERANCE`; barcode + batch id; note "Label content is invented." |
| Screen 3 actions | 3 | `Print ticket F1`, `Next batch F3` |
| Status bar | all | `SCALE 3 kg · READY`, `SCALE 32 kg · READY`, `SCANNER`, `PRINTER`, `ORGATEX · LINKED 07:41`, `EN`, clock |

## 3. User actions

| Action | Where | Prototype effect | Product mapping |
|--------|-------|------------------|-----------------|
| Touch batch row / scan batch card | 1 | (static) | FR-2 |
| Touch pending component | 2 | `select(i)` → becomes active, weight reset; done ignored | FR-4 |
| Simulate dispense / overshoot / Reset | 2 | pour animation to target+0.4·tol / target+4.8·tol / zero | T-2, T-6 |
| OK · Confirm | 2 | actual = now; state done; next pending activated; last → screen 3 | FR-13, FR-16, FR-18 |
| Re-tare | 2 | reset weight to 0 | FR-7 |
| Quit | 2 | reset weight to 0 | FR-17 |
| Supervisor override | 2 | status text only | FR-15 |
| Print ticket | 3 | (static) | FR-20 |
| Next batch | 3 | (static) | back to screen 1 |
| F1/F2/F3/F4 labels | 2,3 | labels only (21-key terminal, A-10) | keyboard shortcuts — Could |

## 4. Application states

Component: `pending` → `active` → `done` (no back-transition once done).
Weighing zone (function `zone(v)`): `under` (< 90 % target) → `near` (≥ 90 % target, < min) → `ok` (min … max) → `over` (> max).
Batch: queued → weighing → weighed (screen 3).
Devices: READY / (offline not modelled in prototype).

## 5. Data displayed

Batch: id, order, machine, fabric/lot (e.g. `100% CTN knit · 480 kg`), shade, component count, status.
Component: id, name, code, colour, target, unit, tol, scale, display max, lot, container, tare, actual, state.
Completion: count, all-in-tolerance, total dispensed, elapsed, operator, write-back time.
Ticket: header, batch/order/machine/shade/date/operator, component lines, verdict, barcode.

## 6. Data required (from APIs)

| Data | Source |
|------|--------|
| Batch queue + batch context | Dummy OrgaTEX `GET /api/batches`, `GET /api/batches/:id` |
| Recipe components incl. tol, lot, container, tare | Dummy OrgaTEX `GET /api/batches/:id/recipe` |
| Scale list, status, live weight, tare | Dummy Scale `GET /api/scales`, `/:id/status`, `/:id/weight`, `POST /:id/tare` |
| Scale selection threshold, scale display max | WeighingMS configuration |
| Operators | WeighingMS configuration |
| Write-back ack | Dummy OrgaTEX `POST /api/batches/:id/consumption` |
| Ticket print ack | Dummy Printer `POST /api/tickets` |
| Scan events | Dummy Scanner |

## 7. State transitions

```text
Screen1 --select batch--> Screen2(first pending active)
Screen2: active.zone under/near --pour--> ok --pour--> over
         ok --OK--> component done --> next pending active | none left --> Screen3
         any --Re-tare/Quit--> weight 0 (zone under)
         over --Override (+supervisor)--> done (OVERRIDE)
Screen3 --Print ticket--> printed;  --Next batch--> Screen1
```

## 8. Validation behaviour

- `btn-ok.disabled = zone !== "ok"` — confirm only in tolerance (inclusive: `v >= target - tol` and `v <= target + tol`).
- Done components cannot be reselected.
- Display precision by unit: g → 1 dp, kg → 3 dp (`dp(unit)`).

## 9. Integration points

OrgaTEX (queue, recipe, write-back — "Queue received from OrgaTEX at 06:12", "Written to OrgaTEX CONFIRMED"), Scale ×2, Scanner ("Scan a batch card"), Printer (ticket). All are static text in the prototype → Dummy APIs in the product.

## 10. Business rules embedded in JavaScript

| Rule | Prototype code | Status in product |
|------|----------------|-------------------|
| Tolerance absolute per component (≈ 0.5 % of target in data: 6.0/1240, 2.0/386, 0.5/94, 0.120/24, 0.048/9.6) | `components[].tol` | Adopt as recipe data (A-07) |
| Inclusive tolerance band | `zone()` | Adopt (FR-12) |
| "near" at ≥ 90 % of target | `zone()` | Adopt as styling only |
| Scale per component, unit switches g ↔ kg | `components[].scale/unit` | Adopt via configurable rule (FR-8) |
| Pour model: step = max(0.4 % target, 5.5 % remaining) every 34 ms | `run()` | Dummy Scale simulation (T-2) |
| Next pending auto-selected after confirm | `btn-ok` handler | Adopt (FR-16) |
| Surplus % = surplus / target | surplus panel | Display (FR-14) |
| Recalculate remaining components to preserve ratio | surplus panel text ("Proposal") | **NOT adopted — Step 24 decision** |
| Override = status text only | `btn-override` | Replaced by real override flow (FR-15) |
| Re-tare and Quit both just reset | handlers | Distinguished: Re-tare zeroes scale; Quit abandons component (FR-7, FR-17) |

## 11. Assumptions represented by the prototype

Stated by the prototype itself: weight can be read **continuously**; surplus compensation means **recalculating the remainder**; **one operator weighs one component at a time** against a queue owned by OrgaTEX. Also implied: one container per component (C-09, C-11, C-12, D-03, D-05), a fixed tare per container type (214 g / 1.850 kg), English UI, 21-key terminal function keys.

## 12. Questions the prototype cannot answer

Pinned: Q6 OrgaTEX interface; Q15 scale models / threshold / boundary; Q16 continuous vs stabilised; Q24 tolerance definition & owner; Q25 surplus compensation meaning; Q29 container identity & tare; Q33 override authority; Q35 language; Q37 operator login. Plus: Re-tare vs Quit semantics, what "Next batch" does with an unprinted ticket, behaviour when devices or OrgaTEX are offline, what B-24187's prior state "WEIGHING, 2 of 5" means for a fresh start (product seed starts B-24187 at 0 of 5 so the full workflow can be demonstrated).
