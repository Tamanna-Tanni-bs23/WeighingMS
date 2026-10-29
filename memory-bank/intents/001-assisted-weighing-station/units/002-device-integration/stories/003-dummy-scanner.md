---
id: 003-dummy-scanner
unit: 002-device-integration
intent: 001-assisted-weighing-station
status: done
priority: should
created: 2026-10-29T14:31:22Z
assigned_bolt: 002-device-integration
implemented: true
---

# Story: 003-dummy-scanner

## User Story

**As a** operator
**I want** to scan a batch card or dyestuff barcode
**So that** selection and identity check don't depend on typing

## Requirements

FR-2, FR-4, FR-23

## Acceptance Criteria

- [ ] `POST /api/_dummy/scanner/scan {code}` injects a scan
- [ ] `GET /api/scanner/next` returns and consumes the next pending scan (or 204)
- [ ] Offline scanner → `503 SCANNER_UNAVAILABLE`

## UI/UX Impact

None directly; consumed by Station UI via API

## API Dependencies

Dummy Scale / Scanner / Printer

## Test Expectations

API tests

## Technical Notes

UI polls while on screens 1–2.
