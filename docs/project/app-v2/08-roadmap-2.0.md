# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.1

## Purpose

This roadmap starts the `2.0.x` App-first line.

## Current checkpoint

### 2.0.0-alpha.1

Status: current.

- Add App-first transition documents.
- Align app display version to `2.0.0-alpha.1`.
- Preserve `/ui` alpha.27 as the design-baseline showroom.
- Do not create an Expo project.

## Next planned checkpoints

### 2.0.0-alpha.2

- Create Expo skeleton.
- Add mock-only production-card navigation.
- No real DB/API/R2/PDF integration unless a later work order explicitly expands scope.

### 2.0.0-alpha.3

- Mock production-card overview UX.
- Establish device-frame navigation for iPhone/tablet directions.

### 2.0.0-alpha.4

- Mock image and attachment flow.
- Define representative-image rules in app UX.

### 2.0.0-alpha.5

- Mock size/color flow.
- Preserve inch fraction entry direction.

### 2.0.0-alpha.6

- Mock fabric and accessory card flows.

### 2.0.0-alpha.7

- Mock production flow.

### 2.0.0-alpha.8

- Mock output and share flow.

## Later integration phases

API, DB, R2, PDF, Worker, native auth, and production deployment integration must be separate phases after mock app structure is stable.

## Current blocked work

Until explicitly approved, do not do:

- DB migration,
- production API changes,
- R2/Worker mutation,
- real PDF generation,
- package dependency changes,
- lockfile changes,
- production behavior changes.
