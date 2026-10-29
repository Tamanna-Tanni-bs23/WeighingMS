---
unit: 003-weighing-station
intent: 001-assisted-weighing-station
phase: inception
status: ready
default_bolt_type: ddd-construction-bolt
created: 2026-10-29T14:31:22Z
updated: 2026-10-29T14:31:22Z
---

# Unit Brief: Weighing Station Core

## Purpose

The WeighingMS domain: scale-selection rule, tolerance evaluation, weighing session and component progression, confirmation with full traceability, overshoot and supervisor override, batch completion with OrgaTEX write-back, and ticket composition. Exposed through the WeighingMS station API.

## Scope

### In Scope
- Configurable scale-selection rule
- Tolerance evaluation (inclusive, unit-aware)
- Weighing session state (active batch, component states)
- Confirm / Re-tare / Quit / Override use cases
- Transaction records (JSON repository)
- Completion, write-back orchestration, pending/retry
- Ticket composition
- Station API `/api/station/*`, `/api/weighings`, operators/config

### Out of Scope
- Rendering (004)
- Device/OrgaTEX transport (001, 002)

---

## Assigned Requirements

| FR | Requirement | Priority |
|---|---|---|
| FR-2 | Batch selection rules | Must |
| FR-4 | Component selection | Must |
| FR-5 | Lot capture | Must |
| FR-6 | Container | Must |
| FR-7 | Tare/Re-tare | Must |
| FR-8 | Scale selection rule | Must |
| FR-12 | Tolerance | Must |
| FR-13 | Confirmation | Must |
| FR-14 | Overshoot | Must |
| FR-15 | Supervisor override | Must |
| FR-16 | Progression | Must |
| FR-17 | Quit | Must |
| FR-18 | Completion | Must |
| FR-19 | Write-back orchestration | Must |
| FR-20 | Ticket composition | Must |
| FR-21 | Operator traceability | Must |
| FR-24 | History | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|---|---|---|
| WeighingSession | Aggregate: one batch being weighed at the station | sessionId, batchId, operatorId, startedAt, components[], status |
| ComponentWeighing | State of one recipe component in the session | componentId, state(pending/active/done), scaleId, result |
| WeighingTransaction | Immutable confirmed record | batch, component, lot, container, tare, scale, target, actual, unit, tolerance, result, operatorId, supervisorId?, reason?, timestamp |
| ToleranceBand | Value object | target, tol, min, max, unit |
| ScaleRule | Value object (config) | thresholdKg, precisionScaleId, floorScaleId |
| Ticket | Composed print document | batch header, lines, verdict, barcode |

### Key Operations
| Operation | Description | Inputs | Outputs |
|---|---|---|---|
| selectScale | Pick scale for target | target | scaleId |
| evaluate | Zone for weight | weight, band | UNDER/IN_RANGE/TARGET/OVER |
| startBatch | Open session | batchId, operatorId | WeighingSession |
| activateComponent | Make component active, tare | componentId | session |
| confirm | Record valid weighing | componentId | WeighingTransaction |
| override | Accept with authorisation | componentId, supervisorId, reason | WeighingTransaction |
| completeBatch | Close + write-back | sessionId | summary + writeBack status |
| composeTicket | Build ticket | batchId | Ticket |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 7 |
| Must Have | 7 |
| Should Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|---|---|---|---|
| 001-scale-selection-rule | Scale selection rule | Must | Planned |
| 002-tolerance-evaluation | Tolerance evaluation | Must | Planned |
| 003-weighing-session-progression | Weighing session progression | Must | Planned |
| 004-confirm-and-record | Confirm and record | Must | Planned |
| 005-overshoot-and-override | Overshoot and override | Must | Planned |
| 006-batch-completion-writeback | Batch completion writeback | Must | Planned |
| 007-ticket-composition | Ticket composition | Must | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|---|---|
| 001-orgatex-integration | Batches, recipes, write-back |
| 002-device-integration | Weight, tare, print |

### Depended By
| Unit | Reason |
|---|---|
| 004-station-ui | All workflow actions |
