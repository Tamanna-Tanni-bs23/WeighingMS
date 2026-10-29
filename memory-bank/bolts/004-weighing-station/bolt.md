---
id: 004-weighing-station
unit: 003-weighing-station
intent: 001-assisted-weighing-station
type: ddd-construction-bolt
status: complete
stories:
  - 005-overshoot-and-override
  - 006-batch-completion-writeback
  - 007-ticket-composition
created: 2026-10-29T14:31:22Z
started: 2026-10-29T14:40:00Z
completed: 2026-10-29T15:06:12Z
current_stage: null
stages_completed: []

requires_bolts: 
  - 003-weighing-station
enables_bolts: 
  - 006-station-ui
requires_units: []
blocks: false

complexity:
  avg_complexity: 3
  avg_uncertainty: 3
  max_dependencies: 1
  testing_scope: 2
---

## Bolt: 004-weighing-station

### Objective
Overshoot ADR (Step 24 human decision), completion, write-back, ticket (Steps 24, 26, 27)

### Stories Included
- **005-overshoot-and-override**
- **006-batch-completion-writeback**
- **007-ticket-composition**

### Bolt Type
**Type**: ddd-construction-bolt
**Stages**: Model → Design → ADR → Implement → Test
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

### Dependencies
**Requires**: 003-weighing-station
**Enables**: 006-station-ui

### Test Expectations
Unit tests for all rules + API tests; tolerance boundary table
