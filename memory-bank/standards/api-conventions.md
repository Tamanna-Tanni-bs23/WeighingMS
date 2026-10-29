# API Conventions

## Overview
REST + JSON over HTTP, single origin, all endpoints under `/api`.

## Resource Naming
- Plural nouns, kebab-case: `/api/batches`, `/api/scales`, `/api/tickets`
- Path params camelCase in docs: `/api/batches/:batchId/recipe`
- Actions as sub-resources with POST: `/api/scales/:scaleId/tare`, `/api/batches/:batchId/consumption`

## Request / Response
- `Content-Type: application/json`
- Field names camelCase.
- Quantities carry explicit units: `{ "value": 94.0, "unit": "g" }` or suffixed fields (`targetGrams`) — never unit-less numbers.
- Timestamps: ISO 8601 UTC (`2026-10-28T22:21:36Z`).

## Status Codes
| Code | Use |
|------|-----|
| 200 | Successful read / action |
| 201 | Resource created (ticket, transaction) |
| 400 | Validation failed |
| 404 | Unknown batch / scale / component |
| 409 | Business-rule conflict (e.g. confirm outside tolerance, batch incomplete) |
| 503 | Dummy device / OrgaTEX unavailable |

## Error Format
```json
{ "error": { "code": "OUT_OF_TOLERANCE", "message": "Weight 94.6 g is above tolerance (93.5–94.5 g)", "details": {} } }
```
Codes are stable UPPER_SNAKE_CASE strings; UI maps codes to messages.

## Versioning
None (training build). Dummy contracts are documented in the bolt design artifacts.

## Dummy Control Endpoints
Training/test-only endpoints under `/api/_dummy/*` (e.g. set simulated weight, toggle device availability). Clearly marked as non-production.
