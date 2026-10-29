---
id: 007-ticket-composition
unit: 003-weighing-station
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 004-weighing-station
implemented: true
---

# Story: 007-ticket-composition

## User Story

**As a** operator
**I want** a weighing ticket composed from the records and sent to the printer
**So that** the container travels with its ticket

## Requirements

FR-20

## Acceptance Criteria

- [ ] Ticket has header, batch, order, machine, shade, date, operator, component TGT/ACT lines with units, verdict, barcode value
- [ ] `POST /api/station/ticket` composes and prints via PrinterPort; returns ticket
- [ ] Reprint marked REPRINT
- [ ] Printer down → `503`, ticket still returned for preview

## UI/UX Impact

Drives screen 2/3 behaviour via station API

## API Dependencies

OrgatexPort, ScalePort, PrinterPort

## Test Expectations

API tests → STEP-27 evidence

## Technical Notes

Follow memory-bank/standards.
