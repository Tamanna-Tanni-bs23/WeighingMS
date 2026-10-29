---
id: 005-overshoot-and-override
unit: 003-weighing-station
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 004-weighing-station
implemented: true
---

# Story: 005-overshoot-and-override

## User Story

**As a** operator / supervisor
**I want** a defined, safe outcome when a component is over-dosed
**So that** over-doses are never silently accepted

## Requirements

FR-14, FR-15

## Acceptance Criteria

- [ ] OVER reports surplus amount and % (e.g. +2.4 g, +2.6 %)
- [ ] Confirm stays blocked when OVER
- [ ] Override requires supervisor + reason; record marked OVERRIDE
- [ ] Surplus-handling rule implemented exactly as decided in the Step 24 ADR

## UI/UX Impact

Drives screen 2/3 behaviour via station API

## API Dependencies

OrgatexPort, ScalePort, PrinterPort

## Test Expectations

Unit + API tests → STEP-24 evidence

## Technical Notes

DDD ADR stage = Step 24 human decision (Q-08).
