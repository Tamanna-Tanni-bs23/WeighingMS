---
id: 002-tolerance-evaluation
unit: 003-weighing-station
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 003-weighing-station
implemented: true
---

# Story: 002-tolerance-evaluation

## User Story

**As a** operator
**I want** each weight classified as under / in range / target / over
**So that** I know without calculating whether to keep pouring

## Requirements

FR-12

## Acceptance Criteria

- [ ] Target 94.0 ±0.5 g: 93.4 UNDER, 93.5 IN_RANGE, 94.0 TARGET, 94.5 IN_RANGE, 94.6 OVER
- [ ] Comparison at unit display precision (no float errors)
- [ ] `near` flag at ≥ 90 % of target while UNDER
- [ ] Band exposes min/max for the UI caption

## UI/UX Impact

Drives screen 2/3 behaviour via station API

## API Dependencies

OrgatexPort, ScalePort, PrinterPort

## Test Expectations

Unit tests (workbook Step 22 table) → STEP-22-tolerance-tests.txt

## Technical Notes

Pure function; ToleranceBand value object.
