---
unit: 002-device-integration
intent: 001-assisted-weighing-station
phase: inception
status: ready
default_bolt_type: simple-construction-bolt
created: 2026-10-29T14:31:22Z
updated: 2026-10-29T14:31:22Z
---

# Unit Brief: Device Integration

## Purpose

Owns ScalePort, ScannerPort and PrinterPort with Dummy implementations: two scales with pour simulation and tare, a scanner, and a ticket printer, plus training control endpoints.

## Scope

### In Scope
- Dummy Scale API: `GET /api/scales`, `/:scaleId/status`, `/:scaleId/weight`, `POST /:scaleId/tare`
- Scale definitions: `scale-3kg` (g, 0.1) and `scale-32kg` (kg, 0.001)
- Pour simulation + `/api/_dummy/scales/*` controls
- Dummy Scanner API
- Dummy Printer `POST /api/tickets`
- Online/offline controls for each device

### Out of Scope
- Choosing which scale (003)
- Ticket content (003)
- Real device protocols

---

## Assigned Requirements

| FR | Requirement | Priority |
|---|---|---|
| FR-7 | Tare command | Must |
| FR-8 | Scale definitions | Must |
| FR-9 | Live weight + simulation | Must |
| FR-2 | Batch scan | Must |
| FR-4 | Dyestuff scan | Must |
| FR-20 | Printer endpoint | Must |
| FR-22 | Device status | Must |
| FR-23 | Device failures | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|---|---|---|
| Scale | Weighing device | scaleId, label, unit, resolution, capacity, status |
| WeightReading | Live reading | scaleId, value, unit, stable, timestamp |
| ScanEvent | Scanned code | code, timestamp |
| PrintJob | Printed ticket | ticketId, batchId, document, printedAt, reprint |

### Key Operations
| Operation | Description | Inputs | Outputs |
|---|---|---|---|
| readWeight | Current net weight | scaleId | WeightReading |
| tare | Zero the scale | scaleId | WeightReading |
| pour | Simulate pour to landing | scaleId, landing | — |
| scan | Inject/consume scan | code | ScanEvent |
| print | Accept ticket | ticket | PrintJob |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 4 |
| Must Have | 3 |
| Should Have | 1 |

### Stories

| Story ID | Title | Priority | Status |
|---|---|---|---|
| 001-dummy-scale-api | Dummy scale api | Must | Planned |
| 002-scale-simulator-controls | Scale simulator controls | Must | Planned |
| 003-dummy-scanner | Dummy scanner | Should | Planned |
| 004-dummy-printer | Dummy printer | Must | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|---|---|
| — | None |

### Depended By
| Unit | Reason |
|---|---|
| 003-weighing-station | Reads weight, tares, prints |
| 004-station-ui | Device status bar |
