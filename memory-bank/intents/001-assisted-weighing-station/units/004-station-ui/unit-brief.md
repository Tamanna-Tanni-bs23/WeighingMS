---
unit: 004-station-ui
intent: 001-assisted-weighing-station
phase: inception
status: ready
default_bolt_type: simple-construction-bolt
created: 2026-10-29T14:31:22Z
updated: 2026-10-29T14:31:22Z
---

# Unit Brief: Station UI

## Purpose

React station front-end reproducing the prototype's three views and chrome, driven entirely by the WeighingMS station API and Dummy APIs, plus the Playwright E2E suite.

## Scope

### In Scope
- Header + status bar
- 1 · Select batch
- 2 · Weigh (recipe rail, live panel, actions, training simulator)
- 3 · Confirm & print (summary, write-back, ticket preview/print)
- Failure states
- Playwright E2E

### Out of Scope
- Business rules (003)
- Facilitator notes & question pins from the prototype

---

## Assigned Requirements

| FR | Requirement | Priority |
|---|---|---|
| FR-1 | Queue screen | Must |
| FR-2 | Select | Must |
| FR-3 | Recipe rail | Must |
| FR-9 | Live weight | Must |
| FR-10 | Target | Must |
| FR-11 | Remaining/progress | Must |
| FR-13 | Confirm button | Must |
| FR-14 | Surplus panel | Must |
| FR-15 | Override dialog | Must |
| FR-18 | Summary | Must |
| FR-20 | Ticket preview | Must |
| FR-22 | Status bar | Must |
| FR-23 | Failure states | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|---|---|---|
| ViewState | Current screen + session snapshot | view, session, reading |

### Key Operations
| Operation | Description | Inputs | Outputs |
|---|---|---|---|
| poll | Live weight/status polling | scaleId | reading |
| render | Prototype-faithful screens | state | UI |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 8 |
| Must Have | 7 |
| Should Have | 1 |

### Stories

| Story ID | Title | Priority | Status |
|---|---|---|---|
| 001-batch-queue-screen | Batch queue screen | Must | Planned |
| 002-weigh-recipe-rail | Weigh recipe rail | Must | Planned |
| 003-weigh-live-panel | Weigh live panel | Must | Planned |
| 004-confirm-and-progression-actions | Confirm and progression actions | Must | Planned |
| 005-overshoot-override-ui | Overshoot override ui | Must | Planned |
| 006-confirm-and-print-screen | Confirm and print screen | Must | Planned |
| 007-device-status-and-failures | Device status and failures | Should | Planned |
| 008-e2e-test-suite | E2e test suite | Must | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|---|---|
| 003-weighing-station | Station API |
| 002-device-integration | Status, simulator |

### Depended By
| Unit | Reason |
|---|---|
| — | None |
