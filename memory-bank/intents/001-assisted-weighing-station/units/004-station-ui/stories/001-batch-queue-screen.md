---
id: 001-batch-queue-screen
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 005-station-ui
implemented: true
---

# Story: 001-batch-queue-screen

## User Story

**As a** operator
**I want** to see the queue and pick a batch by touch or scan
**So that** I can start weighing quickly

## Requirements

FR-1, FR-2, FR-21, FR-23

## Acceptance Criteria

- [ ] Screen 1 renders rows from `GET /api/batches` (network tab shows the call)
- [ ] Touching B-24187 opens screen 2; scan of `B-24187` does the same
- [ ] Header shows station, batch/order/machine, operator
- [ ] OrgaTEX offline → error + Retry

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

Component test + E2E

## Technical Notes

No `const batches=[…]` in UI.
