---
intent: 001-assisted-weighing-station
phase: inception
status: complete
created: 2026-10-29T14:16:26Z
updated: 2026-10-29T14:31:22Z
---

# Requirements: Assisted Dyestuff Weighing Station (WeighingMS)

> **Intent approved** 2026-10-29 (human checkpoint). Functional/non-functional requirements below are **awaiting human review**.

## Intent Overview

**WeighingMS** is a guided weighing station that sits between the production system (OrgaTEX MES) and the weighing operator in a textile dyehouse. The operator selects a dye batch, the recipe arrives digitally, the correct scale is selected automatically per component, dispensing is guided live against target and tolerance, out-of-tolerance weights are refused (or overridden with a logged, authorised reason), every confirmed weighing is recorded with full traceability, actual consumption is written back to OrgaTEX, and a weighing ticket is printed.

**WeighingMS is not** a replacement for OrgaTEX. OrgaTEX remains the upstream owner of batches and recipes and the downstream receiver of actual consumption. WeighingMS owns only the weighing transaction.

**WeighingMS does not** automate dispensing. The operator dispenses by hand; the system guides and records.

### Business problem

Today (assumed, A-13) the recipe is issued on paper and weighed by eye; what was actually dispensed is never captured. When a batch fails shade approval, a bad recipe cannot be distinguished from a bad weighing, so the cause is never attributed and the error recurs. (brief §2)

### Primary user

**Weighing operator** — daily user at the station; needs a flow faster and less stressful than paper, usable with gloved hands on a touchscreen.

Secondary: **Dyehouse supervisor** (approves overrides, watches progress). Downstream consumers of records: Lab/QA, Store/inventory. (brief §4)

### Desired outcome

A working, demonstrable application that reproduces the functional experience of the supplied prototype end to end:

```text
Batch queue → Select batch → Load recipe → per component: auto-select scale → tare/identify
→ live weight vs target & tolerance → confirm (only when valid) → next component
→ batch complete → consumption write-back to OrgaTEX → print ticket
```

The most important acceptance criterion is that the complete workflow works end to end — not merely that screens resemble the mockup. (project-requirement §12)

## Business Goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| No out-of-tolerance weighing recorded as successful (BO-01) | 100% of confirmed components inside tolerance, or carry a logged authorised override | Must |
| Component-level traceability (BO-02) | Every confirmed weighing records batch, component, target, actual, scale, lot, container, tare, operator, timestamp | Must |
| Correct scale every time | Scale auto-selected by configurable rule (≤ 3 kg precision, > 3 kg heavy-duty); operator never chooses in normal flow | Must |
| Close the loop with OrgaTEX (BO-04) | On batch completion, consumption posted to (Dummy) OrgaTEX and acknowledged | Must |
| Operator clarity / throughput guard (BO-06) | Operator can see status (under / in range / over) and next action without manual calculation | Must |
| Integration readiness | Every external system reached only via a replaceable adapter; Dummy → real swap touches one component | Must |
| Demonstrable failure handling | Scale, scanner, printer, OrgaTEX unavailability each produce a defined, safe behaviour | Should |

## Source Artifacts

| Source | Role (precedence per project-requirement "Important implementation note") |
|--------|------------------------------------------------------------------|
| `docs/brief.md` — BRD v1.1 draft, client FCI | **Business intent** (objectives, scope, BR/FR/IR/NFR, data model, assumptions A-01…A-15) |
| `docs/customize-weighing-station.html` — UI/UX prototype | **Visual experience & interaction patterns**: 1 · Select batch, 2 · Weigh, 3 · Confirm & print; scenario data, tolerance states, scale switching, overshoot behaviour |
| `docs/project-requirement.md` — course project requirement (LMS, 2026-10-16) | **Training scope & settled rules**: mock APIs, scale threshold, tolerance classification, simulation scenarios, minimum record, priorities |

## Scope

### In scope (this intent)

- Batch queue from Dummy OrgaTEX; select batch by touch (and by scan via Dummy Scanner)
- Recipe retrieval per batch (components, targets, units, tolerances, lots)
- Automatic scale selection per component (configurable threshold)
- Container / tare handling and dyestuff identity (lot) capture
- Live guided weighing: weighed now, still to weigh, target, progress, tolerance band, status
- Tolerance enforcement at confirmation (OK enabled only within range)
- Overshoot handling — **rule to be decided by a human** (see Q-08); Re-tare, Quit, Supervisor Override actions
- Component progression; batch cannot complete until all components are complete
- Weighing transaction record with operator traceability
- Actual-consumption write-back to Dummy OrgaTEX
- Weighing ticket generation via Dummy Printer (print / preview)
- Defined behaviour for device and OrgaTEX unavailability
- **Dummy APIs as product artifacts**: Dummy OrgaTEX, Dummy Scale (precision 3 kg + 32 kg floor), Dummy Scanner, Dummy Printer — with control hooks for simulation/testing
- Automated tests: unit (rules), API, Playwright E2E

### Out of scope

- Any real OrgaTEX, scale, scanner or printer integration or protocol
- Real API contracts — Dummy endpoints are **training contracts only**, not claims about the real OrgaTEX interface
- Dispensing-machine control, automated transport, liquid dosing (brief §5.2)
- Recipe authoring/modification (owned by OrgaTEX)
- Real authentication / user management (operator chosen from list; supervisor flag)
- Multi-station / multi-site deployment
- Full offline deferred-sync subsystem (A-03) — only "weighing in progress is not lost when OrgaTEX is down" is in scope; see Q-03
- Operational reporting / supervisor dashboards (brief BR-22/23)

## Constraints

### Technical Constraints

**Project-wide standards**: loaded from `memory-bank/standards/` (TypeScript, Express + React/Vite, ports & adapters, JSON store, Vitest/Playwright).

**Intent-specific constraints**:
- UI must reproduce the supplied prototype; deviations recorded with reasons (Step 28).
- UI must obtain all data via APIs — no scenario data hard-coded in UI components.
- Do not copy the prototype's JavaScript implementation; build from approved requirements.
- Weights always carry explicit units (g vs kg differ between components).

### Business Constraints
- Training/demonstration build; real external systems unavailable.
- Nothing in the brief is confirmed by the client FCI (brief, header warning).

## Assumptions

Status of the brief's assumption register (§12) for **this training build**:

| ID | Assumption (brief) | Status here | Basis |
|----|--------------------|-------------|-------|
| A-01 | OrgaTEX exposes documented REST API (queue, recipe, tolerances) | **Resolved for training** → Dummy OrgaTEX API; real interface still unknown | project-requirement §2, §9 |
| A-02 | OrgaTEX accepts consumption write-back | **Assumed** (workbook requires write-back) → Dummy only | workbook Step 26 |
| A-03 | Weighing continues through OrgaTEX outage, sync later | **Open** — Q-03 | — |
| A-04 | Ticket printer present; label content FCI-defined | **Assumed** → ticket content taken from prototype | prototype screen 3 |
| A-05 | Scales stream continuously with stability flag | **Resolved for training** → Dummy Scale streams gradually changing weight | project-requirement §6 Step 5, §9 |
| A-06 | Rule-based scale selection with defined threshold | **Resolved for training** → ≤ 3 kg precision, > 3 kg heavy-duty (32 kg floor), configurable | project-requirement §5.3; prototype |
| A-07 | Tolerances per component, % with absolute floor, from OrgaTEX | **Partially resolved** → per component/scale, configurable, supplied with recipe; who sets them still open | project-requirement §4.2, §6 Step 6, §7 |
| A-08 | Surplus compensation = proportional recalculation of remaining components | **Open — highest risk.** project-requirement says only "warn" + "no success without explicit authorised exception"; no recalculation mentioned | project-requirement §6 Step 7; brief §12 |
| A-09 | Per-operator traceability; lots captured | **Assumed** → record operator, lot, container, tare (beyond project-requirement minimum) | brief BO-02; workbook Step 25 |
| A-10 | Barcodes on dyestuffs; English UI; 21-key terminal | **Partially** → English UI; Dummy Scanner; 21-key terminal out of scope | — |
| A-11 | One station, one site | **Assumed** | — |
| A-12 | Powder/dry only, no liquids | **Assumed** | — |
| A-13 | Today's process is paper-based | **Assumed** (business case only; no build impact) | — |
| A-14 | Baselines/targets set by FCI later | **Assumed** (placeholders) | — |
| A-15 | Volume fits one station | **Assumed** | — |

## Open Questions

Unresolved by any supplied source. Owner "Human (you)" = decided at a checkpoint for this training build; "FCI" = can only be answered by the client in reality.

| ID | Question | Brief ref | Owner | Resolution |
|----|----------|-----------|-------|------------|
| Q-08 | What does overshoot / surplus handling do? Recalculate remaining components, only display excess, require re-weigh, or supervisor override? | A-08, Q25, Q26, Q33 | Human (Step 24 decision) | Pending |
| Q-09 | Who may authorise a supervisor override, and what must be logged? | A-08, Q33 | Human | Pending |
| Q-07 | Who defines tolerances (OrgaTEX, lab, scale class)? Only the rule is known | A-07, Q24 | FCI | Pending — training uses per-component values from prototype |
| Q-06 | Behaviour when a target sits near the 3 kg boundary (container + tare exceeding scale capacity?) | A-06, Q15 | FCI | Pending — training uses target-only rule |
| Q-29 | Container identity and tare handling — fixed tare per container, or tare on scale each time? | Q29 | Human | Pending |
| Q-37 | Operator identification — login, badge scan, or pick list? | A-09, Q37 | Human | Proposed: pick list (tech-stack standard) |
| Q-03 | On OrgaTEX unavailability at completion: queue and retry, block, or mark pending? | A-03, Q13 | Human | Pending |
| Q-04 | Ticket/label content and format | A-04, Q18 | FCI | Pending — training reproduces prototype ticket |
| Q-02 | Real consumption write-back contract | A-02, Q11, Q12 | FCI / SETEX | Out of scope — Dummy only |
| Q-01 | Real OrgaTEX interface technology (REST / OPC-UA / DB / file) | A-01, Q6–Q10 | FCI / SETEX | Out of scope — adapter isolates it |
| Q-16 | Real scale make/model/protocol and stability flag | A-05, Q15, Q16 | FCI | Out of scope — Dummy Scale |
| Q-35 | Interface language(s) | A-10, Q35 | FCI | Training: English |

Note: the brief cites 41 open questions, but the full question list is not included in the supplied sources; only those referenced by the assumption register and the prototype's pins (Q6, Q15, Q16, Q24, Q25, Q29, Q33, Q35, Q37) are traceable.

---

## Functional Requirements

Legend — **Basis**: `C` confirmed by a source (brief / prototype `UI` / project-requirement `PR`); `A` assumption; `T` training-only dummy behaviour. Brief refs in brackets.

### FR-1: Batch queue
- **Description**: Show the batches released for this station, retrieved from Dummy OrgaTEX `GET /api/batches`: batch, order, machine, fabric/lot, shade, component count, status. [FR-01, FR-04; PR §4.1]
- **Acceptance Criteria**: Queue shows B-24187, B-24188, B-24190, B-24191 with the prototype columns; no batch data is defined in UI code; if OrgaTEX is unavailable the screen shows "OrgaTEX unavailable" and a Retry action.
- **Priority**: Must · **Basis**: C (UI screen 1, PR) · data T

### FR-2: Batch selection
- **Description**: Select a batch by touching its row, or by scanning its batch-card barcode (Dummy Scanner). On selection, load `GET /api/batches/:batchId` and `GET /api/batches/:batchId/recipe`; header shows `BATCH · ORDER · MACHINE`. [FR-02, FR-03, FR-05]
- **Acceptance Criteria**: Touching B-24187 or scanning `B-24187` opens screen 2 with its recipe; a batch not in `RELEASED`/`WEIGHING` state cannot be selected and the reason is shown; job and recipe stay associated until completion or Quit.
- **Priority**: Must (touch) / Should (scan) · **Basis**: C

### FR-3: Recipe loading & component list
- **Description**: Recipe rail lists all components in recipe sequence with swatch, name, code, scale, target + unit and state (`✓ actual` / `WEIGHING` / `PENDING`), plus "n of N components weighed". [FR-06; PR §6 Step 3]
- **Acceptance Criteria**: B-24187 shows 5 components: Remazol Brill. Blue RSPL 1240.0 g, Remazol Red RB 386.0 g, Remazol Yellow RGB 94.0 g, Sodium Sulphate 24.000 kg, Soda Ash 9.600 kg.
- **Priority**: Must · **Basis**: C (UI) · data T

### FR-4: Component identification & selection
- **Description**: Operator touches a pending component to make it active (done components are not selectable). Optionally the dyestuff barcode is scanned and checked against the active component's code. [FR-09]
- **Acceptance Criteria**: Touching a done component does nothing; touching a pending one makes it active and resets the live weighing; scanning a wrong code shows "Wrong dyestuff — expected DYE-4471" and blocks weighing until the correct code is scanned or the scan is skipped.
- **Priority**: Must (select) / Should (scan verify) · **Basis**: C (UI) / A-10

### FR-5: Dyestuff lot
- **Description**: Active component shows its lot (e.g. `LOT 2026-0387`), supplied with the recipe data; the lot is stored on the weighing record. [FR-10]
- **Acceptance Criteria**: Lot shown on screen 2 meta line and present in the transaction record.
- **Priority**: Must · **Basis**: A-09 · lot values T

### FR-6: Container
- **Description**: Active component shows its container ID (e.g. `CONTAINER C-12`), from the recipe data; stored on the record. [Q29]
- **Acceptance Criteria**: Container shown and recorded.
- **Priority**: Must · **Basis**: UI / A (Q-29 open)

### FR-7: Tare
- **Description**: Container tare is shown (e.g. `TARE 214 g`); the scale is tared when a component becomes active, so the displayed weight is net. **Re-tare** zeroes the scale (`POST /api/scales/:scaleId/tare`) and resets the weighed value. [FR-11]
- **Acceptance Criteria**: After Re-tare the weighed-now value reads 0.0 in the component's unit; tare value stored on the record.
- **Priority**: Must · **Basis**: UI / A (Q-29)

### FR-8: Scale selection
- **Description**: Scale is selected automatically: target ≤ 3 kg → **3 kg precision** (unit g, 0.1 g display); target > 3 kg → **32 kg floor** (unit kg, 0.001 kg display). Threshold and scale assignment come from configuration, not code. Screen shows "Scale selected — automatic". [FR-07; PR §5.3]
- **Acceptance Criteria**: Yellow RGB (94.0 g) → 3 kg precision; Sodium Sulphate (24.000 kg) → 32 kg floor and units switch to kg; a 3.000 kg target → precision; 3.001 kg → floor; changing the configured threshold changes the result without code changes.
- **Priority**: Must · **Basis**: C (PR, UI)

### FR-9: Live weight
- **Description**: Weighed-now updates continuously from Dummy Scale `GET /api/scales/:scaleId/weight` (polled ≤ 250 ms). Dummy Scale simulates pouring: rising quickly then easing off toward a landing value. Training-only simulator controls (Simulate dispense / Simulate overshoot / Reset, as in the prototype) drive the Dummy Scale through `/api/_dummy/*`. [FR-13; PR §6 Step 5, §9]
- **Acceptance Criteria**: Pressing Simulate dispense makes the value rise and settle inside tolerance; Simulate overshoot settles above tolerance; values come only from the Scale API.
- **Priority**: Must · **Basis**: C (PR) · simulation T

### FR-10: Target quantity
- **Description**: Show Target in the component's unit. [FR-14]
- **Acceptance Criteria**: Target 94.0 g for Yellow RGB; 24.000 kg for Sodium Sulphate.
- **Priority**: Must · **Basis**: C

### FR-11: Remaining quantity & progress
- **Description**: Show Still-to-weigh = max(0, target − weighed) and a progress bar (0 → scale display max) with the tolerance band and target line marked; status line `DISPENSE — x REMAINING`. [FR-14, FR-15]
- **Acceptance Criteria**: At 90.0 g of 94.0 g, still-to-weigh = 4.0 g; band spans 93.5–94.5 g on the bar.
- **Priority**: Must · **Basis**: C (UI)

### FR-12: Tolerance evaluation
- **Description**: Per-component absolute tolerance from recipe data (configurable; no universal default). Range = [target − tol, target + tol], **inclusive**. Zones: `UNDER` (< min; "near" styling at ≥ 90 % of target), `IN_RANGE` (min…max, with `TARGET` when equal to target), `OVER` (> max). Caption `TOLERANCE ±0.5 g (93.5 – 94.5)`. [FR-16, FR-17; PR §6 Step 6, §7]
- **Acceptance Criteria**: For target 94.0 g ±0.5 g: 93.4 → UNDER, 93.5 → IN_RANGE, 94.0 → TARGET, 94.5 → IN_RANGE, 94.6 → OVER. Comparison uses the component's display precision (no floating-point false negatives). Covered by automated unit tests.
- **Priority**: Must · **Basis**: C (workbook Step 22, PR §7)

### FR-13: Confirmation
- **Description**: `OK · Confirm` is enabled only in IN_RANGE/TARGET. Confirming records a transaction: batchId, componentId, code, name, lot, container, tare, scaleId, target, actual, unit, tolerance, result, operatorId, timestamp (ISO 8601 UTC). Server re-validates the weight — UI state alone cannot confirm. [FR-18, FR-25; PR §6 Step 7, §10]
- **Acceptance Criteria**: Confirm disabled at 93.4 g and 94.6 g, enabled at 93.5/94.0/94.5 g; a direct API confirm with an out-of-range weight returns `409 OUT_OF_TOLERANCE`; record persisted in `data/runtime`.
- **Priority**: Must · **Basis**: C

### FR-14: Overshoot
- **Description**: When OVER, status shows `OVER TOLERANCE — SURPLUS +x` and the surplus panel shows surplus amount and %. Confirmation stays blocked. Recovery actions: Re-tare (discard & re-weigh), Quit, **Supervisor override**. **The surplus-handling business rule (e.g. proportional recalculation of remaining components, as the prototype proposes) is NOT decided** — it is a human decision (workbook Step 24, Q-08). [FR-20–FR-24]
- **Acceptance Criteria**: At 96.4 g for Yellow RGB: surplus +2.4 g (+2.6 %) shown, Confirm disabled. Final behaviour per the approved Step 24 decision record.
- **Priority**: Must · **Basis**: UI; rule **unresolved** (A-08)

### FR-15: Supervisor override
- **Description**: `Supervisor override` lets a user with the supervisor flag (selected from the operator list) accept an out-of-tolerance weight with a mandatory reason; the record is marked `OVERRIDE` with supervisor ID and reason. Scope of what may be overridden follows the Step 24 decision. [FR-23, FR-24, FR-35, FR-36; PR §6 Step 7 "explicit, authorised exception"]
- **Acceptance Criteria**: Override without supervisor or reason is rejected; with both, component completes and the record shows `OVERRIDE`, supervisor, reason.
- **Priority**: Must · **Basis**: C (PR) / A (Q-09)

### FR-16: Component progression
- **Description**: After confirmation the component shows `✓ actual`, the counter increments, and the next pending component becomes active automatically. Order follows recipe sequence (Blue RSPL → Red RB → Yellow RGB → Sodium Sulphate → Soda Ash) but any pending component may be chosen. [FR-06; PR §6 Step 8]
- **Acceptance Criteria**: Confirming Blue RSPL activates Red RB; a component cannot be marked complete without a valid weight or an approved override.
- **Priority**: Must · **Basis**: C

### FR-17: Quit
- **Description**: `Quit` abandons the active component's current weighing (no record) and returns it to pending; batch progress already confirmed is kept. [FR-19]
- **Acceptance Criteria**: After Quit, no transaction is written for that component; confirmed components remain done.
- **Priority**: Must · **Basis**: UI (prototype resets) / A

### FR-18: Batch completion
- **Description**: When all components are confirmed, screen 3 shows `Batch B-24187 weighed`: components weighed 5 of 5, all within tolerance YES/NO, total dispensed (kg), elapsed time, operator. The batch cannot be completed with any component pending. [PR §6 Step 9]
- **Acceptance Criteria**: Completion API returns `409 BATCH_INCOMPLETE` while any component is pending; summary values match the records.
- **Priority**: Must · **Basis**: C

### FR-19: OrgaTEX write-back
- **Description**: On completion, WeighingMS posts actual consumption to Dummy OrgaTEX `POST /api/batches/:batchId/consumption`; the summary shows `Written to OrgaTEX — CONFIRMED hh:mm:ss`. Dummy OrgaTEX stores the consumption record. [FR-26, BO-04]
- **Acceptance Criteria**: Request returns 200 with acknowledgement; stored record contains every component's actual, lot, operator; if OrgaTEX is unavailable the summary shows `PENDING — not written` with Retry and the weighing records are not lost.
- **Priority**: Must · **Basis**: A-02 (dummy T)

### FR-20: Ticket generation
- **Description**: `Print ticket` builds a ticket from the records — header `FCI DYEING — WEIGHING TICKET`, batch, order, machine, shade, date, operator, component lines (target / actual + unit), `ALL WITHIN TOLERANCE` (or override note), batch barcode — sends it to Dummy Printer `POST /api/tickets`, and shows a print preview (browser print). Reprint marked `REPRINT`. [FR-27, FR-28]
- **Acceptance Criteria**: Ticket for B-24187 lists the five components with their actuals; printer returns 201 with ticket ID; reprint shows REPRINT.
- **Priority**: Must (print) / Could (reprint) · **Basis**: UI (content invented per prototype note) / A-04

### FR-21: Operator traceability
- **Description**: Operator is chosen at session start from a configured list (default `R. Karim · Shift A`); header shows operator. Every record carries operatorId; overrides carry supervisorId. [FR-34; BO-02]
- **Acceptance Criteria**: Header shows the operator; every transaction and the write-back payload include operatorId.
- **Priority**: Must · **Basis**: A-09 (pick list = decision, Q-37)

### FR-22: Device & integration status
- **Description**: Status bar shows `SCALE 3 kg · READY`, `SCALE 32 kg · READY`, `SCANNER`, `PRINTER`, `ORGATEX · LINKED hh:mm`, language `EN`, clock — reflecting live Dummy API health.
- **Acceptance Criteria**: Taking a Dummy device offline flips its indicator within 2 s.
- **Priority**: Should · **Basis**: UI

### FR-23: Scale / scanner / printer / OrgaTEX failure
- **Description**: Defined, safe behaviour when a dependency is unavailable (forced through `/api/_dummy/*` controls):
  - **Scale unavailable**: live weight shows `SCALE OFFLINE`, Confirm disabled, no record written; resumes when back.
  - **Scanner unavailable**: touch selection still works; scan field disabled with notice.
  - **Printer unavailable**: ticket stays in preview with `Printer unavailable — retry`; completion and write-back are unaffected.
  - **OrgaTEX unavailable**: queue shows error + Retry; at completion see FR-19 (records kept, write-back pending, retry).
  - **Invalid weight** (negative, non-numeric, above scale capacity): treated as error, Confirm disabled.
- **Acceptance Criteria**: Each scenario above passes an automated test (workbook Step 30).
- **Priority**: Must · **Basis**: C (workbook) / A-03 for OrgaTEX policy (Q-03)

### FR-24: Weighing history
- **Description**: Completed weighing records remain retrievable per batch (`GET /api/weighings?batchId=`), and the summary can be reopened. [FR-29; PR §6 Step 9, §10]
- **Acceptance Criteria**: After completion, records for B-24187 are returned by the API.
- **Priority**: Should · **Basis**: C (PR)

---

## Non-Functional Requirements

### Performance
| Requirement | Metric | Target |
|-------------|--------|--------|
| Live weight refresh | UI update interval | ≤ 250 ms |
| API response (local) | p95 latency | < 100 ms |
| Weighing a full batch | No added wait states | Never slower than the operator's pour (BO-06 guard) |

### Scalability
| Requirement | Metric | Target |
|-------------|--------|--------|
| Stations | Concurrent | 1 (A-11); design must not preclude several |

### Security
| Requirement | Standard | Notes |
|-------------|----------|-------|
| Network exposure | Bind 127.0.0.1 | Training build |
| Authorisation | Supervisor flag for override | No real auth (decision) |
| Input validation | zod at HTTP boundary | All request bodies |

### Reliability
| Requirement | Metric | Target |
|-------------|--------|--------|
| No lost weighing | Confirmed records survive restart | 100 % (JSON store, atomic write) |
| Safe failure | Device/OrgaTEX outage never records an invalid weighing | 100 % |

### Usability
| Requirement | Metric | Target |
|-------------|--------|--------|
| Touch targets | Minimum size | 15 mm (≈ 57 px) |
| Status legibility | State shown by colour **and** text | All zones |
| Fidelity | Labels, units, screen names match prototype | Deviations listed in UI validation |

### Maintainability / Integration readiness
| Requirement | Metric | Target |
|-------------|--------|--------|
| Replaceable integrations | Dummy → real swap | Touches only the adapter for that system |
| Test coverage | Domain rules | 100 % of tolerance/progression/overshoot rules; Playwright E2E happy path + failure scenarios |

### Compliance
| Requirement | Standard | Notes |
|-------------|----------|-------|
| None in training scope | — | Retention/audit policy (A-09) open |

---

## Training-only Dummy Behaviour (not product requirements)

| ID | Behaviour |
|----|-----------|
| T-1 | Seed data: 4 batches (B-24187, B-24188, B-24190, B-24191); B-24187 recipe exactly as prototype; other recipes invented, labelled as such |
| T-2 | Dummy Scale pour simulation (fast then easing) toward a landing value; Simulate dispense = target + 0.4·tol; Simulate overshoot = target + 4.8·tol (prototype values) |
| T-3 | `/api/_dummy/*` control endpoints: set weight, start pour, set device/OrgaTEX online/offline, reset data |
| T-4 | Dummy OrgaTEX stores received consumption posts in `data/runtime/orgatex-consumption.json` |
| T-5 | Dummy Printer stores tickets in `data/runtime/printed-tickets.json` |
| T-6 | Simulator panel on screen 2, visibly marked "Training simulator" |

## Decisions Proposed for Approval (with requirements)

| ID | Decision | Why |
|----|----------|-----|
| D-1 | Q-29: tare comes from recipe/container data; scale is zeroed when a component becomes active; Re-tare re-zeroes | Matches prototype; simplest |
| D-2 | Q-37: operator pick list, supervisor flag | Tech-stack standard |
| D-3 | Q-03: OrgaTEX down at completion → records kept, write-back `PENDING`, manual Retry; no background sync | Keeps A-03 safety without the full sync subsystem |
| D-4 | Q-08 overshoot rule deferred to Step 24 human decision; until then Confirm stays blocked when OVER | Workbook Rule 2 / Step 24 |
