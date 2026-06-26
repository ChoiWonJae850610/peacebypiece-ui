# Codex Current State - 0.24.24.1

## Active execution gate

- Current version: `0.24.24.1`.
- Next implementation version: `0.24.25` only after 0.24.24.1 simulator attachment/R2 foundation confirmation and separate user approval.
- Current work result: **Simulator Attachment/R2 Lifecycle Integration foundation** added canonical simulator attachment manifest, guard/preflight/menu structure, and contracts without actual DB/R2 mutation.
- Next work: **Sprint D - Authorization, Runtime Boundary, and Opaque Routing** after user approval.
- Single active execution authority: `docs/project/31-pre-codex-integrated-master-plan.md`.
- Authority consistency gate: `docs/project/32-pre-codex-authority-consistency-gate.md`.
- Final owner policy: `docs/project/26-final-policy-decisions-and-master-todo.md`.
- DB audit and migration design: documents 27, 28, and 29.

Active dependency order:

`DB Foundation -> Source Architecture Cleanup -> WAFL UI Foundation -> Simulator Attachment/R2 Lifecycle Integration -> Authorization/Runtime/Opaque Routing -> Signup/Trial -> Catalog/Size/POM -> PDF/R2 -> Export -> Storage/Termination/Deletion -> PG Billing -> Operations/Security/Launch QA`

Older documents that describe `0.24.22` as UI-first, PB-005/006/010 implementation, or a no-DB-authority-change UI boundary are historical and superseded.

## Mandatory Start Rules

1. Read `AGENTS.md`, this file, document 26, document 31, then the target Sprint specifications.
2. Do not broaden the current Sprint without stopping and recording the newly discovered dependency.
3. Do not execute production DB/R2/PG mutations without separate explicit approval.
4. Any DB change requires read-only reconciliation, deployed-schema drift evidence, dry-run, rollback steps, and a separate migration boundary.
5. Before 1.0, `master` remains the single development/QA branch. After local/build/contract checks pass, commit and push to `origin/master` for Vercel real-device QA.
6. Preserve `/id-control` and the system-admin/test-company role switcher for dev/test QA. Keep original-session restore and audit logging. Block all of it in production.

## 0.24.22 Result Boundary

0.24.22 was executed as an evidence-first DB Foundation Sprint.

- Menu 30 DB Schema Reconciliation Audit: PASS, total result rows 0.
- Menu 31 DB Constraint Readiness Check: PASS, total reported issues 0.
- Menu 32 DB Index Usage/Query Readiness Report: PASS, total result rows 430 as a report.
- Production DB/R2 mutation: 0.
- Schema migration/backfill/RLS DDL execution: none.
- Commit/push evidence: `753ba58671a81227588556bc6cfc22c35343c993`.

## 0.24.23 Result Boundary

0.24.23 was executed as a source architecture cleanup Sprint.

- `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx`: 52,725 bytes before cleanup, 40,366 bytes after cleanup.
- `components/workorder/drawing/workOrderDrawingCanvasPrimitives.tsx`: 15,425 bytes.
- Source audit: `docs/audits/source-architecture-cleanup-0.24.23.md`.
- New files above 50KB: 0.
- Production DB/R2 mutation: 0.
- Schema migration/backfill/RLS DDL execution: none.
- Deprecated PDF Worker deletion: not performed.

0.24.24 started only after the owner confirmed the 0.24.23 source cleanup result.

## 0.24.24 Result Boundary

0.24.24 was executed as a WAFL UI Foundation Sprint.

- Added `components/common/ui/WaflStorageUsageMeter.tsx` as a shared storage usage visualization focused on readable numbers, status, and quota context.
- Applied the shared meter to the customer administrator main dashboard and file storage plan card.
- Reduced `/workspace` dashboard card height and avoided forcing 3 columns before wide desktop.
- Kept `/worker` on the existing `WorkOrderWorkspace` route and verified its WAFL empty/loading state panel boundary.
- Avoided permission, tenant, API, repository, DB, R2, PDF, package, and lockfile changes.

UI Foundation result:

- New source files above 50KB: 0.
- Production DB/R2 mutation: 0.
- Schema migration/backfill/RLS DDL execution: none.
- Package/lockfile change: none.
- Manual PC/mobile/tablet visual confirmation remains required before 0.24.25 starts.

## 0.24.24.1 Result Boundary

0.24.24.1 was executed as a non-destructive simulator attachment/R2 lifecycle foundation follow-up after 0.24.24 QA found that Simulator DB Seed and actual Neon attachment/R2 source-of-truth could diverge.

- Added canonical manifest: `tools/simulator/fixtures/attachments/canonical-lifecycle-manifest.json`.
- Added attachment lifecycle command: `tools/simulator/commands/attachment-lifecycle.mjs`.
- Added PowerShell menu 34~41 for plan/generate/upload+seed/verify/lifecycle/cleanup/fault boundaries.
- Added dev/test DB and R2 fingerprint preflight guard variables and exact confirmation strings.
- Added contracts: `tests/simulator-attachment-manifest-contract.mjs` and `tests/simulator-attachment-lifecycle-contract.mjs`.
- Normal lifecycle fixtures are separate from capacity boundary fixtures.
- Production DB/R2 mutation: 0.
- Dev/test Neon DB/R2 mutation: 0.
- Actual R2 upload/delete, Neon attachment seed, lifecycle mutation, cleanup, and fault fixture creation: not executed.
- DB schema migration/backfill/RLS DDL execution: none.
- Package/lockfile change: none.

Before any actual dev/test Neon/R2 simulator execution, Codex must stop and report runtime, Neon fingerprint, R2 account/bucket fingerprint, company count, workorder count, file count, expected bytes, simulator prefix, DB mutation range, R2 mutation range, cleanup range, confirmation string, and partial-failure recovery method.

## Runtime And Product Preservation

- Public website scope remains in the plan: `www.wafl.co.kr`, root-to-www redirect, pricing, Trial CTA, inquiry/policy links, signup/login, and post-login app routing.
- `/id-control` is not dead code. It is a dev/test QA facility and must remain production-blocked.
- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by environment-name strings.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- System administrators must not gain access to customer operational content; the business-certificate approval viewer remains the narrow exception.
- Existing role, workflow, PDF, DB, and R2 semantics must not be changed during UI Foundation work without target tests and explicit Sprint scope.

## Deferred Dependencies

- PG provider and final payment-provider wording: after business registration/provider selection.
- Analytics and Cookie consent: post-Codex TODO.
- Instagram operating strategy: post-Codex TODO.
- Final legal, tax, processor, overseas-transfer, and operator identity wording: pre-launch review.

## Required Completion Gate For Every Sprint

- TypeScript and production build pass.
- Applicable contract, E2E, tenant, permission, mutation, Unicode, and secret checks pass.
- No unapproved package/lockfile changes.
- Documentation and roadmap match actual implementation.
- `master = origin/master`, working tree clean.
- Vercel deployment and PC/mobile/tablet real-device QA complete when required.

## Pre-Codex Final Contract Gate

- PowerShell wrapper verification remains the preferred entry point for version work.
- Single active execution authority and Applicable contract checks must remain visible to Codex before implementation.
