# Coding Standards

## Overview
Strict TypeScript, Prettier-formatted, ESLint-checked. Domain rules (tolerance, progression, overshoot) are pure functions with exhaustive unit tests; integrations go through adapters.

## Code Formatting

**Tool**: Prettier
**Key Settings**:
- printWidth: 100
- singleQuote: true
- semi: true
- trailingComma: all

**Enforcement**: on save (editor) and `npm run lint` before completing each bolt.

## Linting

**Tool**: ESLint (flat config)
**Base Config**: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks`
**Strictness**: strict

**Key Rules**:
- `@typescript-eslint/no-explicit-any`: error - contracts must be typed
- `@typescript-eslint/no-floating-promises`: error - device/API calls must be awaited or handled
- `react-hooks/exhaustive-deps`: warn - live-weight polling correctness
- `no-console`: warn - use the logger (server)

TypeScript: `strict: true`, `noUncheckedIndexedAccess: true`.

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables / functions | camelCase | `evaluateTolerance` |
| Types / interfaces / classes | PascalCase | `WeightReading`, `ScalePort` |
| React components | PascalCase | `WeighScreen` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_POLL_MS` |
| API paths | kebab-case, plural nouns | `/api/batches/:batchId/recipe` |
| Units in names | suffix with unit | `targetGrams`, `toleranceGrams` |

**File Naming**:
- Components: `PascalCase.tsx`
- Utilities / modules: `kebab-case.ts`
- Tests: `*.test.ts(x)` beside source; E2E: `tests/e2e/*.spec.ts`

## File Organization

**Pattern**: domain-driven backend, feature-based frontend

**Structure**:
```text
src/
├── shared/            # API contract types shared by client + server
├── server/
│   ├── domain/        # pure rules: tolerance, progression, overshoot, batch state
│   ├── application/   # use cases (select batch, confirm component, complete batch)
│   ├── ports/         # interfaces: OrgatexPort, ScalePort, ScannerPort, PrinterPort, repositories
│   ├── adapters/      # Dummy implementations + JSON repositories
│   ├── dummy/         # Dummy API routers + seed data
│   └── http/          # Express routes, error middleware
└── client/
    ├── features/      # batch-select/, weigh/, confirm-print/
    ├── components/    # shared UI pieces
    └── api/           # typed fetch client
tests/e2e/             # Playwright
```

**Conventions**:

- Tests: co-located unit tests; E2E in `tests/e2e/`
- Types: shared contracts in `src/shared/`, local types inline
- Index files: only for public module surfaces (ports, shared)

## Testing Strategy

**Framework**: Vitest (unit + API), Supertest (HTTP), Playwright (E2E)
**Coverage Target**: 100% of domain rules (tolerance boundaries, progression, overshoot); every API endpoint has at least one success and one failure test; one full E2E happy path + failure scenarios.

**Test Types**:

| Type | Tool | When to Use |
|------|------|-------------|
| Unit | Vitest | Pure domain rules (e.g. 93.4 / 93.5 / 94.0 / 94.5 / 94.6 g boundary cases) |
| API / integration | Vitest + Supertest | Express routes against Dummy adapters |
| Component | Vitest + Testing Library | Screen states (confirm disabled/enabled) where cheaper than E2E |
| E2E | Playwright | Full batch flow B-24187 → write-back → ticket; device failure scenarios |

**Conventions**:

- Test naming: `it('rejects confirmation below tolerance (93.4 g)')`
- Test structure: Arrange / Act / Assert
- Mock strategy: no mocking of domain; use Dummy adapters with controllable state (e.g. force scale offline) rather than ad-hoc mocks

## Error Handling

**Pattern**: domain functions return result objects (`{ ok: true, value } | { ok: false, error }`); infrastructure throws typed errors caught by Express error middleware.

**Custom Errors**: yes — `DomainError`, `DeviceUnavailableError`, `IntegrationError`, each with a stable `code`.

**API Errors**: see `api-conventions.md` (`{ error: { code, message, details? } }`).

## Logging

**Tool**: pino (server); no logging library on client
**Format**: structured JSON (pretty-printed in dev)

**Levels**:

| Level | Usage |
|-------|-------|
| error | Integration/device failures, unhandled errors |
| warn | Rejected confirmations, overshoot, retries |
| info | Batch selected, component confirmed, batch completed, write-back, ticket printed |
| debug | Scale polling, request details |

**Rules**:

- Always log: batchId, componentId, operatorId, scaleId on weighing events
- Never log: secrets/credentials (none in training build, rule holds for real adapters)
