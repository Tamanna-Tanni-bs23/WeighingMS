---
id: 002-dummy-orgatex-consumption-api
unit: 001-orgatex-integration
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 001-orgatex-integration
implemented: true
---

# Story: 002-dummy-orgatex-consumption-api

## User Story

**As a** WeighingMS
**I want** to post actual consumption for a completed batch to Dummy OrgaTEX
**So that** consumption is reconciled against the batch (BO-04)

## Requirements

FR-19, FR-23

## Acceptance Criteria

- [ ] `POST /api/batches/B-24187/consumption` with valid payload returns `200` and an ack with `postId`, `receivedAt`
- [ ] Posted record is stored and retrievable for evidence
- [ ] Invalid payload returns `400 VALIDATION_FAILED`
- [ ] When OrgaTEX is forced offline the endpoint returns `503 ORGATEX_UNAVAILABLE`

## UI/UX Impact

None directly; consumed by Station UI via API

## API Dependencies

Dummy OrgaTEX

## Test Expectations

API tests: 200, 400, 503

## Technical Notes

Stored in `data/runtime/orgatex-consumption.json`.
