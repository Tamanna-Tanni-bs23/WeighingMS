---
id: 008-e2e-test-suite
unit: 004-station-ui
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 006-station-ui
implemented: true
---

# Story: 008-e2e-test-suite

## User Story

**As a** team
**I want** a Playwright suite for the full B-24187 flow and failure scenarios
**So that** the product is proven automatically

## Requirements

FR-1, FR-23

## Acceptance Criteria

- [ ] Happy path: select B-24187 → 5 components confirmed → write-back → ticket
- [ ] Failure scenarios: scale/OrgaTEX/printer unavailable, under/over tolerance, re-tare, quit, incomplete batch
- [ ] HTML report + video generated

## UI/UX Impact

Screen(s) of the prototype — see ui-analysis.md

## API Dependencies

WeighingMS station API, Dummy device status

## Test Expectations

Playwright → STEP-29/30

## Technical Notes

Uses `/api/_dummy/*` for deterministic weights.
