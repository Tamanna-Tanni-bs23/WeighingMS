---
id: 002-weigh-recipe-rail
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 005-station-ui
implemented: true
---

# Story: 002-weigh-recipe-rail

## User Story

**As a** operator
**I want** the recipe rail showing every component and its state
**So that** I can see what's done, active and pending

## Requirements

FR-3, FR-4, FR-5, FR-6

## Acceptance Criteria

- [ ] 5 components with swatch, name, code · scale, target + unit, state text
- [ ] 'n of 5 components weighed' counter
- [ ] Touching a pending component activates it; done ignored
- [ ] Meta line shows CODE · LOT · CONTAINER · TARE

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

Component test + E2E

## Technical Notes

Follow memory-bank/standards.
