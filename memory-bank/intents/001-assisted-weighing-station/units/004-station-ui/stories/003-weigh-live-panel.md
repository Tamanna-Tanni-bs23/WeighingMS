---
id: 003-weigh-live-panel
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 005-station-ui
implemented: true
---

# Story: 003-weigh-live-panel

## User Story

**As a** operator
**I want** live weight, still-to-weigh, target, progress bar with tolerance band and status line
**So that** I can pour accurately without calculating

## Requirements

FR-7, FR-8, FR-9, FR-10, FR-11, FR-12

## Acceptance Criteria

- [ ] Weighed now updates ≤ 250 ms from Scale API
- [ ] Bar band and target line positioned per tolerance; caption `TOLERANCE ±0.5 g (93.5 – 94.5)`
- [ ] Status text per zone, colour + text
- [ ] Scale cell shows selected scale + 'automatic'; switching to Sodium Sulphate shows 32 kg floor and kg
- [ ] Training simulator: Simulate dispense / overshoot / Reset

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

E2E (scale switch, tolerance UI)

## Technical Notes

Follow memory-bank/standards.
