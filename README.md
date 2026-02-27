# SpaceFlow WMS

SpaceFlow WMS is a portfolio-grade Warehouse Management System dashboard built with Next.js App Router.  
It demonstrates how natural-language commands can be translated into typed logistics intents and applied consistently across a 2D data grid, a 3D warehouse view, and an event-driven operations simulator.

![SpaceFlow Interface](docs/screenshot.jpg)

## Why This Project

This is not positioned as a full enterprise WMS replacement.  
It is an AI-augmented operations prototype that focuses on:

- deterministic AI intent contracts for operational safety
- reversible state-changing commands (undoable AI actions)
- synchronized data + spatial views for logistics decision support

## Overview

Traditional WMS interfaces often require users to navigate deep, multi-step filtering workflows or separate command consoles for operational actions.  
SpaceFlow introduces a constrained AI intent layer that supports both read and write workflows:

- `filter` intents: query and highlight pallets (e.g. "show delayed pallets in Zurich")
- `action` intents: execute logistics operations safely (e.g. "relocate PAL-00001 to zone C", "change PAL-00002 destination to Bern")

## Architecture

### Backend-for-Frontend API

- User input is sent to `POST /api/parse-intent`.
- The route validates request shape and size before processing.
- OpenAI Structured Outputs + Zod enforce deterministic JSON contracts for a typed `LogisticsIntent` schema.
- The API returns either:
  - a `filter` intent (for read/query operations), or
  - an `action` intent (for state-changing operations like `scan`, `relocate`, `pick`, `load`, `putaway`, `delay`, `set_destination`).
- The frontend only consumes server-validated intent objects.

### State and UI Composition

- `zustand` is used as the application state boundary for pallets, filters, selection state, lifecycle events, and simulation state.
- Deterministic pallet lifecycle events (`received`, `putaway`, `scan`, `relocated`, `picked`, `loaded`, `delay_flagged`) are used to derive operational KPIs.
- The table, 3D scene, and overlay components are decoupled and react to shared state updates.
- Live simulation runs globally in store state, so inventory actions, dashboard KPIs, table rows, and 3D positions stay synchronized across routes.

### Performance Strategy

- 3D shelf structures use `THREE.InstancedMesh` to reduce draw calls.
- Pallets are currently rendered as individual meshes for interaction clarity.
- The tabular view uses virtualization via `@tanstack/react-virtual`.
- This combination supports large datasets while preserving interactive frame rates and DOM performance.

## AI Capabilities

Natural-language commands are interpreted into typed intents and executed safely:

- **AI filtering**
  - `show me PAL-00001`
  - `show delayed pallets in Bern and highlight them red`
- **AI operations**
  - `relocate PAL-00001 to zone C`
  - `change PAL-00001 status to stored`
  - `change PAL-00002 destination to Bern`
  - `scan all high urgency pallets`
- **Targeting model**
  - Single-pallet targeting via `targetPalletId`
  - Bulk targeting via filter criteria + capped `maxTargets`
- **Safety UX**
  - AI-triggered mutations show Sonner toasts with one-click **Undo**

## Operations Simulator

- `/inventory` provides an operator-style action console for manual event simulation.
- Supports per-pallet actions (`scan`, `relocate`, `pick`, `load`, `putaway`, `delay`) and live auto-simulation.
- Occupancy checks prevent relocation into already occupied physical slots.
- Zone-aware 3D layout (A/B/C) provides clear spatial feedback when pallets move between zones.

## Demo Script (60 Seconds)

Use these commands in sequence to demonstrate capability quickly:

1. `show me PAL-00001`
2. `change PAL-00001 status to stored`
3. `move PAL-00001 to zone C`
4. `change PAL-00001 destination to Bern`
5. Click **Undo** in Sonner toast to revert the last AI mutation

What this demonstrates:
- typed AI parsing for both read and write operations
- real-time updates in table + KPI + 3D spatial view
- operational safety through reversible commands

## Engineering Decisions

- **Typed intent boundary**
  - `POST /api/parse-intent` returns validated, deterministic `LogisticsIntent` payloads instead of free-form model output.
- **Centralized state orchestration**
  - A single Zustand store coordinates pallets, filtered sets, lifecycle events, simulation loop, and mutation APIs.
- **Event-driven KPI derivation**
  - Operational metrics are computed from pallet lifecycle events, not hardcoded dashboard numbers.
- **Safety-first mutations**
  - Relocations enforce occupancy constraints; AI write actions are undoable through toast actions.

## Known Limitations

- AI intent parsing relies on prompt+schema constraints and may still require iterative tuning for edge phrasing.
- Current simulation is in-memory and single-user; no persistence or server reconciliation.
- No authentication/authorization layer for write operations in this prototype.
- Test suite covers core logic paths but is not yet full integration/e2e coverage.

## Security

Security controls are documented in detail in [`SECURITY.md`](SECURITY.md).  
Current controls include:

- Global HTTP security headers, including CSP.
- API payload and input hardening for LLM-facing routes.
- Edge middleware controls for API routes.
- OWASP Top 10 (2021) mapping for interview and review traceability.

## Technology Stack

- Next.js (App Router, Route Handlers, Middleware)
- React + TypeScript
- Three.js, React Three Fiber, `@react-three/drei`
- Zustand
- Tailwind CSS + shadcn/ui
- OpenAI SDK + Zod
- `@tanstack/react-virtual`

## Local Development

### Prerequisites

- Node.js 18+ (or current LTS)
- npm

### Setup

```bash
npm install
```

### Environment

Create a `.env.local` file with required variables:

```bash
OPENAI_API_KEY=your_key_here
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Project Notes

- This repository is intentionally scoped as an interview-ready reference implementation.
- The focus is AI-assisted logistics workflows, system design clarity, secure defaults, and performance-conscious frontend engineering.