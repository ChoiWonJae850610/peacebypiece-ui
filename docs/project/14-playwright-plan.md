# PeaceByPiece Playwright Plan

## Objective

Expand Playwright by risk and stable business journeys rather than by page count. Tests must remain deterministic, tenant-safe, and independent of production services.

## Suites

### Smoke

- sign-in/session bootstrap fixture;
- core workspace opens;
- workorder list/detail opens;
- material-order area opens;
- company-admin and system-admin guards;
- no uncaught page error.

### Workflow

- create/edit/save workorder;
- review request, approval/rejection, order request;
- inbound/inspection flow with role boundaries;
- supplier/material-order generation path;
- attachment metadata and permission behavior using test fixtures.

### Responsive and Interaction

- drawer open/close and background lock;
- modal ESC, focus trap, sticky close;
- accordion and horizontal table/card fallback;
- mobile numeric inputs and keyboard-safe controls;
- preserved scroll position.

### Admin and Operations

- `/id-control`, `/roadmap`, `/functions`, storage usage;
- non-system-admin denial;
- impersonation indicator and restore;
- read-only pages do not expose mutation controls;
- dangerous operations remain unavailable without explicit guarded fixtures.

### PDF/R2 Contract

Before production integration, test typed document model, naming, state labels, object-key construction, quota and lifecycle fixtures. Binary visual fidelity remains a manual/visual comparison gate until a stable renderer fixture is available.

## Test Data

Use dedicated dev/test companies and users. Seed scenarios must identify tenant, role, storage fill level, workflow state, and expected cleanup. Tests must not depend on execution order and must clean only their own allowlisted data.

## CI/Execution Policy

- Run smoke on every implementation sprint.
- Run targeted suites based on changed paths.
- Run full regression at planned checkpoints and release candidates.
- Capture trace/screenshot/video only on failure unless a QA evidence profile requires otherwise.
- Do not commit generated reports.

## Flake Policy

A retry may diagnose but does not convert an unstable test into PASS evidence. Flakes receive an owner, reproduction note, and fix or quarantine expiry. Critical permission and tenant tests may not be silently quarantined.
