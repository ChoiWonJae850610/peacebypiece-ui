# PeaceByPiece QA Matrix

## Risk Tiers

| Tier | Change type | Minimum evidence |
| --- | --- | --- |
| Q0 | docs only | links, version/roadmap contract, ZIP integrity |
| Q1 | isolated UI/read-only | TypeScript, build, targeted contract, PC/mobile smoke |
| Q2 | workflow/permission/API | targeted unit/contract, build, role matrix, negative cases, real-device QA |
| Q3 | DB/R2/PDF/destructive operations | Q2 plus fixtures, concurrency/failure recovery, dry-run, explicit approval, audit evidence |

## Functional Matrix

Each affected feature must cover:

- happy path;
- validation and empty input;
- loading, empty, error, stale, and partial-failure states;
- duplicate click/idempotency;
- permission denied and cross-tenant denial;
- retry/reload/navigation;
- audit/history visibility where required;
- Korean text, date, number, unit, and long-content handling.

## Role Matrix

At minimum test:

- designer;
- inbound/inspection manager;
- company administrator;
- system administrator;
- unauthenticated/expired session;
- impersonated test role where allowed.

UI hiding is never sufficient; server/API denial is included when a write or private read path changes.

## Responsive Matrix

- PC desktop Chrome.
- iPhone Safari and Chrome/WebKit-equivalent flow.
- Android Chrome.
- iPad portrait and landscape.
- Galaxy Tab portrait and landscape.
- Narrow and wide desktop boundaries.

Check drawer/modal scroll lock, ESC, focus trap, sticky controls, table/card fallback, keyboard overlap, touch targets, and return scroll position.

## Data and Operations Matrix

For DB/R2/PDF changes add:

- tenant isolation;
- quota boundaries at below 80%, 80%, below 100%, 100%, and over-limit;
- trash/restore/purge eligibility;
- orphan/mismatch reconciliation fixtures;
- duplicate and concurrent requests;
- partial failure and compensation;
- audit and approval references;
- no production mutation during test unless explicitly approved.

## Exit Rule

A version is not release-ready when a required automatic gate fails, a blocker manual scenario fails, evidence is missing, or an affected unresolved product decision has been silently assumed.
