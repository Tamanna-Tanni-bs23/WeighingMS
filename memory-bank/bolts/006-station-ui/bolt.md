---
id: 006-station-ui
unit: 004-station-ui
intent: 001-assisted-weighing-station
type: simple-construction-bolt
status: complete
stories:
  - 005-overshoot-override-ui
  - 006-confirm-and-print-screen
  - 007-device-status-and-failures
  - 008-e2e-test-suite
created: 2026-10-29T14:31:22Z
started: 2026-10-29T14:40:00Z
completed: 2026-10-29T15:06:12Z
current_stage: null
stages_completed: []

requires_bolts: 
  - 004-weighing-station
  - 005-station-ui
enables_bolts: []
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 2
  testing_scope: 3
---

## Bolt: 006-station-ui

### Objective
Screen 3, override UI, failure states, Playwright E2E (Steps 26–30)

### Stories Included
- **005-overshoot-override-ui**
- **006-confirm-and-print-screen**
- **007-device-status-and-failures**
- **008-e2e-test-suite**

### Bolt Type
**Type**: simple-construction-bolt
**Stages**: Plan → Implement → Test
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

### Dependencies
**Requires**: 004-weighing-station, 005-station-ui
**Enables**: None

### Test Expectations
Playwright E2E + component tests
