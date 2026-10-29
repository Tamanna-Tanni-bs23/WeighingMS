---
id: 004-confirm-and-record
unit: 003-weighing-station
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 003-weighing-station
implemented: true
---

# Story: 004-confirm-and-record

## User Story

**As a** operator
**I want** to confirm a weighing only when it is within tolerance and have it recorded with full traceability
**So that** no out-of-tolerance weighing is recorded as success

## Requirements

FR-5, FR-6, FR-13, FR-16, FR-21

## Acceptance Criteria

- [ ] Server reads current weight from the ScalePort and re-evaluates; out of range → `409 OUT_OF_TOLERANCE`
- [ ] Valid confirm writes a transaction with batch, component, lot, container, tare, scale, target, actual, unit, tolerance, result, operatorId, timestamp
- [ ] Component becomes done; next pending activated
- [ ] Scale offline → `503 SCALE_UNAVAILABLE`, nothing recorded

## UI/UX Impact

Drives screen 2/3 behaviour via station API

## API Dependencies

OrgatexPort, ScalePort, PrinterPort

## Test Expectations

Unit + API tests → STEP-25-transaction.json

## Technical Notes

Follow memory-bank/standards.
