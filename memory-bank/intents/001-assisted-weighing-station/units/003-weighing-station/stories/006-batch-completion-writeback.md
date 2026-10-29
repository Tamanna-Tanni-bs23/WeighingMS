---
id: 006-batch-completion-writeback
unit: 003-weighing-station
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 004-weighing-station
implemented: true
---

# Story: 006-batch-completion-writeback

## User Story

**As a** operator
**I want** the batch completed and actual consumption written back to OrgaTEX
**So that** OrgaTEX knows what was really dispensed

## Requirements

FR-18, FR-19, FR-24

## Acceptance Criteria

- [ ] Completion while any component pending → `409 BATCH_INCOMPLETE`
- [ ] Completion builds summary (count, all-in-tolerance, total kg, elapsed, operator)
- [ ] Posts consumption via OrgatexPort; ack time shown as CONFIRMED
- [ ] OrgaTEX down → write-back PENDING, records kept, `POST …/writeback/retry` succeeds later
- [ ] `GET /api/weighings?batchId=` returns records

## UI/UX Impact

Drives screen 2/3 behaviour via station API

## API Dependencies

OrgatexPort, ScalePort, PrinterPort

## Test Expectations

API tests → STEP-26 evidence

## Technical Notes

Follow memory-bank/standards.
