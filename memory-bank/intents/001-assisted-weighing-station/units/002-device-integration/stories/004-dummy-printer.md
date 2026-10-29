---
id: 004-dummy-printer
unit: 002-device-integration
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 002-device-integration
implemented: true
---

# Story: 004-dummy-printer

## User Story

**As a** WeighingMS
**I want** to send a ticket to a Dummy printer
**So that** the ticket step can be demonstrated

## Requirements

FR-20, FR-23

## Acceptance Criteria

- [ ] `POST /api/tickets {ticket}` returns `201 {ticketId, printedAt}`
- [ ] Printed tickets stored in `data/runtime/printed-tickets.json`
- [ ] Offline printer → `503 PRINTER_UNAVAILABLE`

## UI/UX Impact

None directly; consumed by Station UI via API

## API Dependencies

Dummy Scale / Scanner / Printer

## Test Expectations

API tests

## Technical Notes

Follow memory-bank/standards.
