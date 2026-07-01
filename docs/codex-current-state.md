# Codex Current State - 0.24.30

## Version

- Current version: `0.24.30`.
- Current implementation version: `0.24.30`.
- Branch: `master`.
- Previous completed version: `0.24.29` Integrated Productization Checkpoint.
- Next official version: `0.24.31` PG Billing and Subscription Operations.

## Policy Authority

- Product policy source order remains: `AGENTS.md`, this file, `docs/project/26-final-policy-decisions-and-master-todo.md`, `docs/project/31-pre-codex-integrated-master-plan.md`, related latest confirmed topic specs, then canonical roadmap.
- Final owner policy still requires Trial 7 days, Trial storage 100MB, Trial members 3, no raw card storage, and PG-neutral handling until the 0.24.31 billing sprint.
- System-admin actual/effective session boundaries and runtime-independent internal read screens remain unchanged from 0.24.25.x corrections.
- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`.
- `/id-control` test account switching is allowed for active allowlisted system-admin users and remains unrelated to destructive Seed/Reset/Cleanup operations.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- Regression contract: system-admin-internal-access.

## 0.24.30 Scope

0.24.30 is Storage Capacity Profiles. It connects plan limits, company usage aggregation, workspace storage summary data, and server-side upload quota preflight.

Implemented storage policy:

- Trial: 100MB storage, 3 members.
- Lite: 500MB storage, 3 members.
- Flow: 1.5GB storage, 10 members.
- Studio: 5GB storage, 30 members.
- Custom: negotiated; current technical fallback remains Studio-sized until a system-admin override exists.

Usage inclusion:

- Active workorder attachments.
- Recoverable trash items that are not restored and not purged.
- Active company files.
- Active onboarding files.
- Approved signup business certificates that have not already been promoted to a company file.

Growth paths guarded:

- Workorder attachment upload target creation.
- Workorder attachment upload completion.
- Generated workorder PDF storage.

Allowed while full:

- Existing text/content reads and edits that do not create storage objects.
- Delete, trash, restore, purge, and exact cleanup paths that reduce or preserve storage.

Out of scope for 0.24.30:

- PG billing, payment method, billing key, or subscription operation implementation.
- Notification email sending.
- Kakao external API sending.
- Automatic deletion, grace-period jobs, or termination jobs.
- Worker source change or Worker deployment.
- Customer dashboard redesign or `/workers` redesign.

## Verification State

- DB migration this version: none.
- Production DB/R2/Worker mutation: false.
- Worker source/deployment change: none.
- User manual QA: pending after Vercel deployment.

## Current Roadmap

- Canonical current detail: `lib/internal/roadmap/roadmap-0.24.30.ts`.
- Productization roadmap document: `docs/productization-roadmap.md`.
- Runtime roadmap screen: `/roadmap`.

## Next Version

0.24.31 is PG Billing and Subscription Operations. It must not start until 0.24.30 is committed, pushed, and handed off.
