---
id: 007-device-status-and-failures
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: should
created: 2026-10-29T14:31:22Z
assigned_bolt: 006-station-ui
implemented: true
---

# Story: 007-device-status-and-failures

## User Story

**As a** operator
**I want** live device/OrgaTEX status and safe failure states
**So that** I know when something is wrong and can't record bad data

## Requirements

FR-22, FR-23

## Acceptance Criteria

- [ ] Status bar reflects live status within 2 s
- [ ] Scale offline → SCALE OFFLINE, OK disabled
- [ ] Printer offline → retry notice; OrgaTEX offline handled per FR-19/FR-1

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

E2E failure suite → STEP-30

## Technical Notes

Follow memory-bank/standards.
