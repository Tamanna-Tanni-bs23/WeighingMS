---
id: 004-confirm-and-progression-actions
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 005-station-ui
implemented: true
---

# Story: 004-confirm-and-progression-actions

## User Story

**As a** operator
**I want** OK · Confirm, Re-tare and Quit actions
**So that** I can complete or restart a component

## Requirements

FR-13, FR-16, FR-17

## Acceptance Criteria

- [ ] OK enabled only in tolerance; click confirms via API and next component activates
- [ ] Re-tare zeroes; Quit abandons
- [ ] Last component confirmed → screen 3

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

E2E

## Technical Notes

Follow memory-bank/standards.
