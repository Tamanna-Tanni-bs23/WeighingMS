---
id: 005-station-ui
unit: 004-station-ui
intent: 001-assisted-weighing-station
type: simple-construction-bolt
status: complete
stories:
  - 001-batch-queue-screen
  - 002-weigh-recipe-rail
  - 003-weigh-live-panel
  - 004-confirm-and-progression-actions
created: 2026-10-29T14:31:22Z
started: 2026-10-29T14:40:00Z
completed: 2026-10-29T14:45:16Z
current_stage: null
stages_completed: []

requires_bolts: 
  - 003-weighing-station
enables_bolts: 
  - 006-station-ui
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 3
---

## Bolt: 005-station-ui

### Objective
Screens 1–2 wired to APIs (Steps 19–23)

### Stories Included
- **001-batch-queue-screen**
- **002-weigh-recipe-rail**
- **003-weigh-live-panel**
- **004-confirm-and-progression-actions**

### Bolt Type
**Type**: simple-construction-bolt
**Stages**: Plan → Implement → Test
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

### Dependencies
**Requires**: 003-weighing-station
**Enables**: 006-station-ui

### Test Expectations
Playwright E2E + component tests
