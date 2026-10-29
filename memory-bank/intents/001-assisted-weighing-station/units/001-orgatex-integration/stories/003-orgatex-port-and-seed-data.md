---
id: 003-orgatex-port-and-seed-data
unit: 001-orgatex-integration
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 001-orgatex-integration
implemented: true
---

# Story: 003-orgatex-port-and-seed-data

## User Story

**As a** developer
**I want** an OrgatexPort with a Dummy adapter and seed data files
**So that** OrgaTEX can be replaced by a real adapter without touching domain code

## Requirements

FR-1, FR-3, FR-23

## Acceptance Criteria

- [ ] `OrgatexPort` interface defines listBatches/getBatch/getRecipe/postConsumption
- [ ] Dummy adapter reads `src/server/dummy/data/*.json`
- [ ] B-24187 seed matches prototype values exactly; invented batches carry `trainingData: true`
- [ ] `POST /api/_dummy/orgatex/{offline|online}` toggles availability

## UI/UX Impact

None directly; consumed by Station UI via API

## API Dependencies

Dummy OrgaTEX

## Test Expectations

Adapter unit tests; seed data snapshot

## Technical Notes

Ports & adapters standard.
