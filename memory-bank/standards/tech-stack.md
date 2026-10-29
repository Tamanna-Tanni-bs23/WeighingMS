# Tech Stack

## Overview
WeighingMS is a full-stack TypeScript web application: a Node.js + Express backend that hosts the WeighingMS domain logic and the training-time Dummy APIs (OrgaTEX, Scale, Scanner, Printer), and a React + Vite frontend that reproduces the supplied `docs/customize-weighing-station.html` prototype. One language end to end keeps API contracts and UI types in sync.

## Languages
TypeScript (strict mode), on Node.js 24 (LTS line, already installed on the station/dev machine).

Rationale: shared typed contracts between UI and API (Batch, Recipe, Component, WeightReading, Ticket); strict typing catches unit/precision mistakes in weight and tolerance arithmetic. Python/Django was considered and rejected for this project: it adds a second runtime and toolchain for no functional gain at training scale.

## Framework
- **Backend**: Express (REST/JSON). Lightweight; the backend is mostly domain rules plus adapter endpoints, no need for a batteries-included framework.
- **Frontend**: React + Vite (SPA). Component/state model fits the three screens (Select batch → Weigh → Confirm & print) and the weighing state machine.
- **Run model**: single command `npm run dev`, single origin. API under `/api/*`, UI at `/`. In dev, Vite proxies `/api` to Express; for demo/preview, Express serves the built UI on one port.

## Authentication
None (training build).

Operator identity is selected from a configured operator list at the station and recorded on every weighing transaction (operator traceability). Supervisor override is a role flag on the operator record, not real authentication. Real authentication is out of scope until the Product Brief's open questions are answered.

## Infrastructure & Deployment
Local machine only (developer workstation / training station). No cloud, no containers.

Rationale: the real OrgaTEX and devices are unavailable; all external systems are replaced by Dummy APIs running in the same process. Station deployment architecture remains an open question in the Product Brief.

## Package Manager
npm (bundled with Node 24).

## Decision Relationships
- TypeScript on both sides → shared `types` module for API contracts.
- Express + ports & adapters (see `system-architecture.md`) → each external system (OrgaTEX, Scale, Scanner, Printer) is an interface with a Dummy implementation, satisfying the brief's requirement that OrgaTEX interaction is confined to one replaceable adapter (IR-07).
- Vite + Playwright → Playwright E2E runs against the same single-origin app the user demonstrates.
