---
id: 001-dummy-orgatex-batch-api
unit: 001-orgatex-integration
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 001-orgatex-integration
implemented: true
---

# Story: 001-dummy-orgatex-batch-api

## User Story

**As a** the station
**I want** to retrieve the batch queue, a batch and its recipe from Dummy OrgaTEX
**So that** the UI never hard-codes scenario data

## Requirements

FR-1, FR-2, FR-3

## Acceptance Criteria

- [ ] `GET /api/batches` returns B-24187, B-24188, B-24190, B-24191 with order, machine, fabric, shade, component count, status
- [ ] `GET /api/batches/B-24187` returns SO-9931 / JET-04 / Teal 4C
- [ ] `GET /api/batches/B-24187/recipe` returns the 5 prototype components with target, unit, tolerance, lot, container, tare
- [ ] Unknown batch returns `404 BATCH_NOT_FOUND`

## UI/UX Impact

None directly; consumed by Station UI via API

## API Dependencies

Dummy OrgaTEX

## Test Expectations

API tests (Supertest) for each endpoint, success + 404

## Technical Notes

Training contract only. Units explicit (`{value, unit}`).
