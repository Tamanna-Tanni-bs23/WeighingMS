---
id: 006-confirm-and-print-screen
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 006-station-ui
implemented: true
---

# Story: 006-confirm-and-print-screen

## User Story

**As a** operator
**I want** the completion summary, OrgaTEX status and ticket preview/print
**So that** I can finish the batch and send the container with its ticket

## Requirements

FR-18, FR-19, FR-20

## Acceptance Criteria

- [ ] Summary values from API
- [ ] `Written to OrgaTEX CONFIRMED hh:mm:ss` or PENDING + Retry
- [ ] Print ticket → preview matching prototype layout + browser print; Next batch → screen 1

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

E2E

## Technical Notes

Follow memory-bank/standards.
