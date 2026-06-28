# Codex Current State - 0.24.25.4

## Active execution gate

- Current version: `0.24.25.4`.
- Next implementation version: `0.24.26`.
- Current work result: **0.24.25.4 policy mismatch correction** aligns system-admin actual/effective session boundaries, business-certificate viewer download blocking, Trial constants, and /id-control error-state UX with the final owner policy before 0.24.26 begins.
- Next work: **Sprint E - Public Signup, Verification, Approval, and Trial**. The detailed canonical roadmap exists at `lib/internal/roadmap/roadmap-0.24.26.ts`; the first schema/repository preparation note exists at `docs/project/33-public-signup-schema-repository-prep-0.24.26.md`; product implementation has not started.
- Single active execution authority: `docs/project/31-pre-codex-integrated-master-plan.md`.
- Authority consistency gate: `docs/project/32-pre-codex-authority-consistency-gate.md`.
- Final owner policy: `docs/project/26-final-policy-decisions-and-master-todo.md`.
- DB audit and migration design: documents 27, 28, and 29.

Active dependency order:

`DB Foundation -> Source Architecture Cleanup -> WAFL UI Foundation -> Simulator Attachment/R2 Lifecycle Integration -> Authorization/Runtime/Opaque Routing -> Signup/Trial -> Catalog/Size/POM -> PDF/R2 -> Export -> Storage/Termination/Deletion -> PG Billing -> Operations/Security/Launch QA`

Older documents that describe `0.24.22` as UI-first, PB-005/006/010 implementation, or a no-DB-authority-change UI boundary are historical and superseded.

## Mandatory Start Rules

1. Read `AGENTS.md`, this file, document 26, document 31, then the target Sprint specifications.
2. Treat the final owner policy documents as the implementation source of truth; if older roadmap/provisional text or prior code conflicts with document 26/current-state, classify it as an implementation mismatch instead of re-asking the same policy.
3. Do not broaden the current Sprint without stopping and recording the newly discovered dependency.
4. Do not execute production DB/R2/PG mutations without separate explicit approval.
5. Any DB change requires read-only reconciliation, deployed-schema drift evidence, dry-run, rollback steps, and a separate migration boundary.
6. Before 1.0, `master` remains the single development/QA branch. After local/build/contract checks pass, commit and push to `origin/master` for Vercel real-device QA.
7. Preserve `/id-control` and the system-admin/test-company role switcher for QA. Keep original-session restore and audit logging. Do not extend this to Seed, Reset, Cleanup, DB/R2 mutation, or destructive simulator actions.

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
- Kept `/id-control` visible to active system administrators; the original 0.24.25 account-switching runtime gate was later superseded by the 0.24.25.3 policy below.
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
- `/id-control` can show seeded company/system target options even when account switching is disabled.
- `/api/dev/test-context/switch` and `/clear` still require active system administrator; the original runtime action gate was later superseded by the 0.24.25.3 policy below.
- General users and customer accounts remain blocked from `/id-control`.
- `4. Newest` release handoff is normalized to exactly two files: latest full source ZIP and matching repo-state TXT. build-result remains in Repo_Status and is referenced from repo-state.
- Production DB/R2 mutation: 0.
- Dev/test DB/R2 mutation: 0.
- DB schema migration/backfill/RLS DDL execution: none.
- Cloudflare Worker code change: none.
- Manual PC/mobile production verification is required after Vercel deploys the patch commit.

## 0.24.25.2 Result Boundary

0.24.25.2 is a post-deploy `/id-control` production QA impersonation gate fix; it is not the start of 0.24.26.

- `/id-control` target listing remains active-system-admin-only and independent from action enablement.
- Switch/clear actions originally required an extra production QA action gate, but that policy was superseded by 0.24.25.3.
- `NEXT_PUBLIC_*` values must not control impersonation.
- Targets must come from the existing `buildDevTestContextOptions` seed/test target allowlist.
- Switch and clear continue to write audit logs without raw cookie payloads, tokens, secrets, or signed URLs.
- General users, customer accounts, non-active system administrators, invalid targets, and arbitrary user ids remain blocked.
- Production DB/R2 mutation: 0.
- Dev/test DB/R2 mutation: 0.
- DB schema migration/backfill/RLS DDL execution: none.
- Cloudflare Worker code change: none.
- Manual PC/mobile production verification is required after Vercel deploys the patch commit.

## 0.24.25.3 Result Boundary

0.24.25.3 is a post-deploy `/id-control` account switching policy correction; it is not the start of 0.24.26.

- `/id-control` switch/clear actions are allowed for active system administrators regardless of local, development, preview, or production runtime.
- `/id-control` switch/clear actions no longer require runtime or action environment flags.
- System-admin allowlist validation, active system-admin route/API guards, seed/test target allowlist lookup, overlay validation, and switch/restore audit logging remain required.
- General users, customer accounts, inactive/non-allowlisted system administrators, invalid targets, arbitrary user ids, arbitrary company ids, and raw role input remain blocked.
- Seed, Reset, Cleanup, DB/R2 mutation, DB migration, Purge, and destructive simulator guards are unchanged.
- Production DB/R2 mutation: 0.
- Dev/test DB/R2 mutation: 0.
- DB schema migration/backfill/RLS DDL execution: none.
- Cloudflare Worker code change: none.
- Manual PC/mobile production verification is recommended after Vercel deploys the patch commit.

## 0.24.25.4 Result Boundary

0.24.25.4 is a policy mismatch correction before 0.24.26; it is not the start of Public Signup, Verification, Approval, and Trial.

- `/api/system/**` common system-admin scope now validates the actual signed auth session and the active system-admin allowlist, so internal system APIs remain available to the real system-admin actor during `/id-control` customer impersonation.
- Customer workspace APIs continue to use the effective impersonated session for role and permission checks.
- System-admin business-certificate approval viewer requests block WAFL-provided download mode; normal approval viewing remains available.
- Trial constants are aligned to the final policy: 7 days, 100MB, and 3 members.
- `/id-control` options loading now has a safe error/retry state instead of staying in loading after fetch, HTTP, or parsing failures.
- Production DB/R2 mutation: 0.
- Dev/test DB/R2 mutation: 0.
- DB schema migration/backfill/RLS DDL execution: none.
- Cloudflare Worker code change: none.

## Runtime And Product Preservation

- Public website scope remains in the plan: `www.wafl.co.kr`, root-to-www redirect, pricing, Trial CTA, inquiry/policy links, signup/login, and post-login app routing.
- `/id-control` is not dead code. Its read/view shell and seed/test account switching remain active-system-admin-only.
- `/id-control` test account switching is allowed for active system administrators regardless of runtime/env action flags.
- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by environment-name strings.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- System administrators must not gain access to customer operational content; the business-certificate approval viewer remains the narrow exception.
- Existing role, workflow, PDF, DB, and R2 semantics must not be changed during UI Foundation work without target tests and explicit Sprint scope.

## Deferred Dependencies

- 0.24.28 PDF/R2 lifecycle reserved scope is recorded in `docs/productization-roadmap.md` and `docs/productization-backlog.md`; implementation has not started.
- 0.24.30 storage enforcement/capacity reserved scope is recorded in `docs/productization-roadmap.md` and `docs/productization-backlog.md`; implementation has not started.
- H/I/J capacity fixture mismatch is recorded as backlog; no DB/R2 mutation was performed to correct fixture data.
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
