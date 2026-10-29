---
id: 001-orgatex-integration
unit: 001-orgatex-integration
intent: 001-assisted-weighing-station
type: simple-construction-bolt
status: complete
stories:
  - 001-dummy-orgatex-batch-api
  - 002-dummy-orgatex-consumption-api
  - 003-orgatex-port-and-seed-data
created: 2026-10-29T14:31:22Z
started: 2026-10-29T14:40:00Z
completed: 2026-10-29T14:45:16Z
current_stage: null
stages_completed: []

requires_bolts: []
enables_bolts: 
  - 003-weighing-station
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 0
  testing_scope: 2
---

## Bolt: 001-orgatex-integration

### Objective
Dummy OrgaTEX API + seed data running; curl evidence (Steps 16–18)

### Stories Included
- **001-dummy-orgatex-batch-api**
- **002-dummy-orgatex-consumption-api**
- **003-orgatex-port-and-seed-data**

### Bolt Type
**Type**: simple-construction-bolt
**Stages**: Plan → Implement → Test
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

### Dependencies
**Requires**: None
**Enables**: 003-weighing-station

### Test Expectations
Supertest API tests for every endpoint (success + failure)
