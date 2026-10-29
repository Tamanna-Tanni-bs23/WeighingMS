---
id: 001-scale-selection-rule
unit: 003-weighing-station
intent: 001-assisted-weighing-station
status: done
priority: must
created: 2026-10-29T14:31:22Z
assigned_bolt: 003-weighing-station
implemented: true
---

# Story: 001-scale-selection-rule

## User Story

**As a** operator
**I want** the correct scale chosen automatically for each component
**So that** I never pick a scale manually

## Requirements

FR-8

## Acceptance Criteria

- [ ] Target ≤ 3 kg → `scale-3kg`; > 3 kg → `scale-32kg`
- [ ] 94.0 g → 3 kg precision; 24.000 kg → 32 kg floor; 3.000 kg → precision; 3.001 kg → floor
- [ ] Threshold read from config; changing it changes selection without code change

## UI/UX Impact

Drives screen 2/3 behaviour via station API

## API Dependencies

OrgatexPort, ScalePort, PrinterPort

## Test Expectations

Unit tests at boundary

## Technical Notes

Pure function + config.
