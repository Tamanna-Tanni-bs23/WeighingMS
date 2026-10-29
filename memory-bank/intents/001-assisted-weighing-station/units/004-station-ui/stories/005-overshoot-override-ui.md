---
id: 005-overshoot-override-ui
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 006-station-ui
implemented: true
---

# Story: 005-overshoot-override-ui

## User Story

**As a** operator / supervisor
**I want** the surplus panel and supervisor override flow
**So that** an over-dose is handled per the approved rule

## Requirements

FR-14, FR-15

## Acceptance Criteria

- [ ] OVER shows surplus panel with amount and %
- [ ] Override dialog: supervisor pick + reason; submits to API
- [ ] UI follows the Step 24 decision

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

E2E

## Technical Notes

Follow memory-bank/standards.
