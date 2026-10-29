---
intent: 001-assisted-weighing-station
phase: inception
status: units-defined
updated: 2026-10-29T14:31:22Z
---

# Units: Assisted Dyestuff Weighing Station

Decomposed by **capability and dependency**, not by screen. Integrations are separated from the domain (ports & adapters); the Weighing Station is a domain unit with its own rules and API, and the UI is a separate front-end unit.

| Unit | Responsibility | Why separate | Bolt type |
|------|----------------|--------------|-----------|
| `001-orgatex-integration` | Owns the OrgatexPort and its Dummy OrgaTEX implementation: batch queue, batch details, recipe and consumption write-back, with training seed data | OrgaTEX must be isolated in one replaceable adapter (IR-07); owns upstream data | simple-construction-bolt |
| `002-device-integration` | Owns ScalePort, ScannerPort and PrinterPort with Dummy implementations: two scales with pour simulation and tare, a scanner, and a ticket printer, plus training control endpoints | Device protocols unknown (A-05, A-10, A-04); same adapter isolation, independent of OrgaTEX | simple-construction-bolt |
| `003-weighing-station` | The WeighingMS domain: scale-selection rule, tolerance evaluation, weighing session and component progression, confirmation with full traceability, overshoot and supervisor override, batch completion with OrgaTEX write-back, and ticket composition | All business rules (tolerance, progression, overshoot, traceability) — domain-heavy, independently testable | ddd-construction-bolt |
| `004-station-ui` | React station front-end reproducing the prototype's three views and chrome, driven entirely by the WeighingMS station API and Dummy APIs, plus the Playwright E2E suite | Feature-based front end; changes with UX, not with rules | simple-construction-bolt |

Considered and merged: *Batch Management* and *Recipe & Material Management* are OrgaTEX-owned data → `001-orgatex-integration` (transport) + `003-weighing-station` (rules). *Scale Integration* + *Ticket & Printing* transport → `002-device-integration`; ticket **content** is domain → `003`.

## Dependency Graph

```text
[001-orgatex-integration] ──┐
                            ├──> [003-weighing-station] ──> [004-station-ui]
[002-device-integration] ───┘                │
          └──────────── status/simulator ────────────────────────┘
```

## Requirement Coverage

| FR | Unit(s) |
|----|---------|
| FR-1 | 001-orgatex-integration, 004-station-ui |
| FR-2 | 001-orgatex-integration, 002-device-integration, 003-weighing-station, 004-station-ui |
| FR-3 | 001-orgatex-integration, 004-station-ui |
| FR-4 | 002-device-integration, 003-weighing-station |
| FR-5 | 003-weighing-station |
| FR-6 | 003-weighing-station |
| FR-7 | 002-device-integration, 003-weighing-station |
| FR-8 | 002-device-integration, 003-weighing-station |
| FR-9 | 002-device-integration, 004-station-ui |
| FR-10 | 004-station-ui |
| FR-11 | 004-station-ui |
| FR-12 | 003-weighing-station |
| FR-13 | 003-weighing-station, 004-station-ui |
| FR-14 | 003-weighing-station, 004-station-ui |
| FR-15 | 003-weighing-station, 004-station-ui |
| FR-16 | 003-weighing-station |
| FR-17 | 003-weighing-station |
| FR-18 | 003-weighing-station, 004-station-ui |
| FR-19 | 001-orgatex-integration, 003-weighing-station |
| FR-20 | 002-device-integration, 003-weighing-station, 004-station-ui |
| FR-21 | 003-weighing-station |
| FR-22 | 002-device-integration, 004-station-ui |
| FR-23 | 001-orgatex-integration, 002-device-integration, 004-station-ui |
| FR-24 | 003-weighing-station |

## Execution Order

1. `001-orgatex-integration`, `002-device-integration` (parallel, no deps)
2. `003-weighing-station` (bolts 003 → 004)
3. `004-station-ui` (bolt 005 after 003; bolt 006 after 004 + 005)
