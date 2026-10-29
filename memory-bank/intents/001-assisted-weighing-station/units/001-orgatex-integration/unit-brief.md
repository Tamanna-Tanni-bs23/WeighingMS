---
unit: 001-orgatex-integration
intent: 001-assisted-weighing-station
phase: inception
status: ready
default_bolt_type: simple-construction-bolt
created: 2026-10-29T14:31:22Z
updated: 2026-10-29T14:31:22Z
---

# Unit Brief: OrgaTEX Integration

## Purpose

Owns the OrgatexPort and its Dummy OrgaTEX implementation: batch queue, batch details, recipe and consumption write-back, with training seed data. Isolates everything OrgaTEX-specific (IR-07).

## Scope

### In Scope
- OrgatexPort interface
- Dummy OrgaTEX REST API (`/api/batches`, `/:batchId`, `/:batchId/recipe`, `POST /:batchId/consumption`)
- Seed data (B-24187 exact prototype recipe; other batches invented, labelled)
- Stored consumption posts
- Online/offline control for failure tests

### Out of Scope
- Weighing rules (003)
- Any real OrgaTEX protocol or contract

---

## Assigned Requirements

| FR | Requirement | Priority |
|---|---|---|
| FR-1 | Batch queue data | Must |
| FR-2 | Batch details | Must |
| FR-3 | Recipe data | Must |
| FR-19 | Consumption write-back endpoint | Must |
| FR-23 | OrgaTEX unavailable behaviour (adapter side) | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|---|---|---|
| Batch | Production batch released by OrgaTEX | batchId, orderId, machine, fabric, shade, componentCount, status |
| Recipe | Component list for a batch | batchId, shade, components[] |
| RecipeComponent | One dyestuff/auxiliary line | componentId, code, name, colour, sequence, target{value,unit}, tolerance, lot, container, tare, displayMax |
| ConsumptionPost | Actuals received from WMS | batchId, operatorId, completedAt, lines[] |

### Key Operations
| Operation | Description | Inputs | Outputs |
|---|---|---|---|
| listBatches | Queue for station | — | Batch[] |
| getBatch | Batch details | batchId | Batch |
| getRecipe | Recipe for batch | batchId | Recipe |
| postConsumption | Store actual consumption | ConsumptionPost | ack{receivedAt, postId} |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 3 |
| Must Have | 3 |
| Should Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|---|---|---|---|
| 001-dummy-orgatex-batch-api | Dummy orgatex batch api | Must | Planned |
| 002-dummy-orgatex-consumption-api | Dummy orgatex consumption api | Must | Planned |
| 003-orgatex-port-and-seed-data | Orgatex port and seed data | Must | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|---|---|
| — | None |

### Depended By
| Unit | Reason |
|---|---|
| 003-weighing-station | Loads batches/recipes, posts consumption |
