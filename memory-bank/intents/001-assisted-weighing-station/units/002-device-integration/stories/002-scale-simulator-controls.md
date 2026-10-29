---
id: 002-scale-simulator-controls
unit: 002-device-integration
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 002-device-integration
implemented: true
---

# Story: 002-scale-simulator-controls

## User Story

**As a** trainer / test
**I want** to drive the Dummy scales (pour to a landing value, set weight, offline/online)
**So that** every weighing scenario can be demonstrated and tested

## Requirements

FR-9, FR-23

## Acceptance Criteria

- [ ] `POST /api/_dummy/scales/:id/pour {landing}` makes weight rise fast then ease off to landing (prototype pour model)
- [ ] `POST /api/_dummy/scales/:id/weight {value}` sets an exact reading
- [ ] `POST /api/_dummy/scales/:id/{offline|online}` toggles status
- [ ] `POST /api/_dummy/reset` restores seed state

## UI/UX Impact

None directly; consumed by Station UI via API

## API Dependencies

Dummy Scale / Scanner / Printer

## Test Expectations

API tests; deterministic set-weight used by E2E

## Technical Notes

Training-only (T-2, T-3).
