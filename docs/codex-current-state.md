# Codex Current State - 0.24.25.1

## Active execution gate

- Current version: `0.24.25.1`.
- Next implementation version: `0.24.26`.
- Current work result: **0.24.25.1 /id-control read-only account list regression fix** restored active system-admin account target listing while preserving 0.24.25 authorization, runtime, tenant, and action-block boundaries.
- Next work: **Sprint E - Public Signup, Verification, Approval, and Trial** after user approval.
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

## 0.24.25 Result Boundary

0.24.25 was executed as the Authorization, Runtime Boundary, and Opaque Routing Sprint.

- Replaced app route usage of the legacy header-preview permission guard with server session, company scope, member status, and permission checks.
- Added common WAFL API states for permission denied, not found, and runtime blocked responses.
- Added server-only runtime resolution for dev/test account switching; `NEXT_PUBLIC_*` runtime values are not trusted for server decisions.
- Kept `/id-control` visible to active system administrators, while account switching requires non-production server runtime plus `WAFL_ENABLE_DEV_TEST_CONTEXT=1`.
- Added opaque-compatible workorder route parameter validation for UUID, current simulator IDs, and future `wo_...` identifiers without adding a DB migration.
- Changed workorder not-found behavior to avoid returning the requested id in API responses.
- Required attachment file proxy access to pass workspace `storage.read`, company prefix, and active DB `attachments.storage_key` or `thumbnail_key` membership.
- Added company scope to primary design attachment updates.
- Reduced R2 error logs so endpoint, bucket, raw key, signed URL, tokens, and secrets are not logged by the shared R2 client.
- Production DB/R2 mutation: 0.
- Dev/test DB/R2 mutation: 0.
- DB schema migration/backfill/RLS DDL execution: none.
- Cloudflare Worker code change: none.
- Operations dashboard PLAN AND STORAGE / policy 기준 / member status UI cleanup was deferred because it is unrelated to the official Sprint D security boundary.

## 0.24.25.1 Result Boundary

0.24.25.1 is a post-deploy regression fix for `/id-control`; it is not the start of 0.24.26.

- `/api/dev/test-context/options` now builds read-only target options for active system administrators before evaluating switch-action enablement.
- `/id-control` can show seeded company/system target options even when production runtime or `WAFL_ENABLE_DEV_TEST_CONTEXT` disables account switching.
- `/api/dev/test-context/switch` and `/clear` still require active system administrator, server dev/test runtime, and `WAFL_ENABLE_DEV_TEST_CONTEXT=1`.
- General users and customer accounts remain blocked from `/id-control`.
- Production DB/R2 mutation: 0.
- Dev/test DB/R2 mutation: 0.
- DB schema migration/backfill/RLS DDL execution: none.
- Cloudflare Worker code change: none.
- Manual PC/mobile production verification is required after Vercel deploys the patch commit.

## Runtime And Product Preservation

- Public website scope remains in the plan: `www.wafl.co.kr`, root-to-www redirect, pricing, Trial CTA, inquiry/policy links, signup/login, and post-login app routing.
- `/id-control` is not dead code. Its read/view shell remains active-system-admin-only; dev/test account switching and execution actions remain production-blocked.
- `/id-control` test account switching is allowed only when the server dev/test runtime and explicit enable flag allow it.
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
- Internal route guard verification includes `system-admin-internal-access`.
- No unapproved package/lockfile changes.
- Documentation and roadmap match actual implementation.
- `master = origin/master`, working tree clean.
- Vercel deployment and PC/mobile/tablet real-device QA complete when required.

## Pre-Codex Final Contract Gate

- PowerShell wrapper verification remains the preferred entry point for version work.
- Single active execution authority and Applicable contract checks must remain visible to Codex before implementation.
