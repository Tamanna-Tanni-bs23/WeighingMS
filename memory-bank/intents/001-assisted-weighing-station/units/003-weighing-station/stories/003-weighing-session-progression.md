---
id: 003-weighing-session-progression
unit: 003-weighing-station
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 003-weighing-station
implemented: true
---

# Story: 003-weighing-session-progression

## User Story

**As a** operator
**I want** to start a batch, activate components and move through them in sequence
**So that** the whole recipe is weighed one component at a time

## Requirements

FR-2, FR-4, FR-7, FR-16, FR-17

## Acceptance Criteria

- [ ] `POST /api/station/session {batchId, operatorId}` opens a session from the OrgaTEX recipe; non-released batch → 409
- [ ] First pending component becomes active; its scale is tared
- [ ] Activating a done component is rejected; activating a pending one makes previous active pending
- [ ] Re-tare zeroes the scale; Quit returns component to pending with no record
- [ ] Session survives server restart

## UI/UX Impact

Drives screen 2/3 behaviour via station API

## API Dependencies

OrgatexPort, ScalePort, PrinterPort

## Test Expectations

Unit + API tests

## Technical Notes

Aggregate WeighingSession; JSON repository.
