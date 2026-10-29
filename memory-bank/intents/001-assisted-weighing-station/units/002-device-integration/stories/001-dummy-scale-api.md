---
id: 001-dummy-scale-api
unit: 002-device-integration
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 002-device-integration
implemented: true
---

# Story: 001-dummy-scale-api

## User Story

**As a** the station
**I want** to read live weight, status and tare from two Dummy scales
**So that** weighing uses scale data, not UI state

## Requirements

FR-7, FR-8, FR-9

## Acceptance Criteria

- [ ] `GET /api/scales` lists `scale-3kg` (3 kg precision, g, 0.1) and `scale-32kg` (32 kg floor, kg, 0.001)
- [ ] `GET /api/scales/scale-3kg/weight` returns `{value, unit, stable, timestamp}`
- [ ] `POST /api/scales/scale-3kg/tare` zeroes the reading
- [ ] Unknown scale → 404; offline scale → `503 SCALE_UNAVAILABLE`

## UI/UX Impact

None directly; consumed by Station UI via API

## API Dependencies

Dummy Scale / Scanner / Printer

## Test Expectations

API tests incl. 404/503

## Technical Notes

Readings rounded to scale resolution.
