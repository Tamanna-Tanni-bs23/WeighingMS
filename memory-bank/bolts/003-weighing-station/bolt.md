---
id: 003-weighing-station
unit: 003-weighing-station
intent: 001-assisted-weighing-station
type: ddd-construction-bolt
status: complete
stories:
  - 001-scale-selection-rule
  - 002-tolerance-evaluation
  - 003-weighing-session-progression
  - 004-confirm-and-record
created: 2026-10-29T14:31:22Z
started: 2026-10-29T14:40:00Z
completed: 2026-10-29T14:45:16Z
current_stage: null
stages_completed: []

requires_bolts: 
  - 001-orgatex-integration
  - 002-device-integration
enables_bolts: 
  - 004-weighing-station
  - 005-station-ui
requires_units: []
blocks: false

complexity:
  avg_complexity: 3
  avg_uncertainty: 1
  max_dependencies: 2
  testing_scope: 2
---

## Bolt: 003-weighing-station

### Objective
Domain + station API for select/weigh/confirm (Steps 22, 25)

### Stories Included
- **001-scale-selection-rule**
- **002-tolerance-evaluation**
- **003-weighing-session-progression**
- **004-confirm-and-record**

### Bolt Type
**Type**: ddd-construction-bolt
**Stages**: Model → Design → ADR → Implement → Test
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

### Dependencies
**Requires**: 001-orgatex-integration, 002-device-integration
**Enables**: 004-weighing-station, 005-station-ui

### Test Expectations
Unit tests for all rules + API tests; tolerance boundary table
