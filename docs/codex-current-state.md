# Codex Current State - 0.24.26

## Active execution gate

- Current version: `0.24.26`.
- Current implementation version: `0.24.26`.
- Current work result: **0.24.26 signup foundation complete for commit/push handoff** implements Public Signup, Verification, Approval, and Trial foundation with signup_applications and signup_application_consents schema applied once to the approved dev/test DB; PostgreSQL repository, applicant session, Google email_verified, draft/status APIs, pending workspace guards, normal-session precedence over stale applicant cookies, public signup draft/status UI, consent evidence API/UI foundation, certificate API/UI/service foundation, guarded certificate R2 integration PASS, system-admin signup review list/detail foundation, approval provisioning repository/API/UI gate, and guarded dev/test approve provisioning integration PASS.
- Next work: 0.24.27 System Catalog, Sizes, and POM after 0.24.26 commit/push handoff. Do not execute production migration, production DB/R2 mutation, actual email sending, PG/billing operations, or later-version work without separate explicit approval.
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

## 0.24.26 Implementation Boundary

0.24.26 completes the Public Signup, Verification, Approval, and Trial foundation for commit/push handoff.

- APP_VERSION is `0.24.26`.
- Canonical roadmap status is `complete`.
- The signup migration was explicitly approved and executed once against the approved dev/test DB only.
- The first implementation step is limited to signup application schema, TypeScript domain types, PostgreSQL repository/service/API foundation, status transition validation, duplicate/idempotency constraints, Google email_verified preservation, applicant session/ownership, pending access guard foundation, and public signup draft/status UI.
- `email_verified` has no database default; OAuth/API code must pass verified Google email evidence explicitly and the schema keeps `CHECK (email_verified = true)`.
- Business registration matching uses `business_registration_number_normalized`, a digits-only canonical 10-digit value, for active duplicate prevention and repository lookup.
- Existing `company_files` and `company_onboarding_files` require `company_id`, so pre-company business certificate ownership is represented by `signup_application_files`; approval may later link to `company_files` through `approved_company_file_id`.
- Generic status transitions do not jump to `provisioning_failed`; provisioning failure is represented by the approval provisioning operation after provisioning has started.
- Pending signup applicants are blocked from workspace page/API access before approval only when no normal WAFL session exists. A valid normal workspace or actual system-admin session takes precedence over a stale applicant cookie.
- Signup draft/status/edit/resubmit/cancel APIs re-check applicant session ownership by Google sub and normalized email. UI status is derived from repository/DB application status, not from cookie onboarding state.
- Public signup UI currently covers CTA, Google signup entry, verified applicant draft form, save, first-click submit, submit/resubmit, required consent UI, status display, cancel, logout, loading/error/empty states, and certificate upload foundation UI. System-admin review list/detail and submitted/reviewing correction/rejection transitions are implemented as a foundation. Notification email, production migration, PG/billing operations, and later version work remain out of scope for this step.
- Signup business certificate foundation is now wired as API/UI/service code with applicant metadata lookup/upload/revoke routes, server-owned canonical storage keys, strict extension/MIME/header validation, replacement transaction order compatible with the active unique index, DB-first revoke, a system-admin approval-only inline viewer foundation, and dev/test R2 upload/replace/revoke integration PASS.
- Certificate replacement uploads the new object first, then updates metadata in one DB transaction by locking the application row, inactivating the old active certificate, and inserting the new active certificate. Old-object cleanup happens after metadata commit and is exact-key/canonical-key guarded.
- Certificate revoke is DB-first. If post-commit R2 cleanup fails or is not configured, the app keeps metadata inactive, logs a structured cleanup-pending event without raw object URL/secret exposure, and leaves orphan reconciliation to the reserved 0.24.28 R2 lifecycle work.
- Certificate upload failure leaves existing active metadata untouched; metadata failure attempts cleanup of the newly uploaded object. No cleanup backlog table or additive migration was added in this foundation step.
- System-admin certificate viewer validates active system-admin actual session, DB MIME allowlist, storage-key extension/MIME consistency, optional object content-type consistency, `no-store`, `nosniff`, and inline disposition. WAFL-provided download mode, signed/public URL exposure, and attachment disposition remain blocked.
- R2/Worker certificate cleanup and viewer failure logs now use safe event code, operation, reason/status/retryable booleans, and presence flags only; raw Worker response body, signed URL/query, secret, storage key string, and provider error message are not logged.
- The guarded dev/test certificate integration harness is implemented as `scripts/run-signup-certificate-r2-integration.mjs` and PowerShell menus 44/45. Menu 45 is a mutation-free preflight that wraps schema discovery in `BEGIN READ ONLY` and always attempts `ROLLBACK`, then reports only fingerprints, schema status, transaction/rollback state, and mutation `none`. Menu 44 is the separately approved dev/test DB/R2 mutation runner. Actual execution requires non-production runtime, approved DB fingerprint, exact Worker URL fingerprint, exact Worker host fingerprint, exact environment fingerprint, `WAFL_DB_AUDIT_APPROVED=1`, and `RUN_SIGNUP_CERTIFICATE_R2_DEV_TEST_INTEGRATION`. Host-only or URL-only fingerprint matches are not sufficient. The runner and production API now share `signupApplicationCertificateOrchestration.mjs` for upload/replace/revoke ordering; the runner keeps only dedicated fixture application creation/cleanup plus adapter wiring. Sanitized manifest fingerprints are written under `2. Logs\R2_Test`, cleanup runs in `finally`, and residual DB rows/R2 objects must be 0 for success.
- Certificate preflight PASS was confirmed in development with approved DB fingerprint `01e5dcc7fea3`, Worker environment fingerprint `cd6334cbc703`, Worker URL fingerprint `b49fb0bd3ff1`, Worker host fingerprint `446bdb61c239`, required schema present, `BEGIN READ ONLY`, `ROLLBACK confirmed`, mutation `none`, result `PASS`, and exit 0.
- The earlier actual certificate integration attempt failed at the first PNG Worker PUT: stage `png-worker-put`, safe code `R2_WORKER_REQUEST_FAILED_400`, status 400, retryable false, responseReceived true, residual DB rows 0, residual R2 objects 0, tracked R2 keys 0. The direct cause was the deployed R2 upload Worker key allowlist missing the canonical `signup-applications/{applicationId}/business-registration/{fileId}.{png|jpg|pdf}` prefix, not signature generation, PNG fixture corruption, or repository ordering.
- `cloudflare/r2-upload-worker.js` is patched to Worker version `0.13.70` with the signup certificate key allowlist and MIME/extension/size policy. After dev/test Worker deployment, final read-only preflight PASS was confirmed with runtime `development`, approved DB fingerprint `01e5dcc7fea3`, Worker environment fingerprint `cd6334cbc703`, Worker URL fingerprint `b49fb0bd3ff1`, Worker host fingerprint `446bdb61c239`, `BEGIN READ ONLY`, `ROLLBACK confirmed`, mutation `none`, result `PASS`, and exit 0.
- The approved actual certificate integration PASS was confirmed after qualifying certificate JOIN columns that caused PostgreSQL `42702` ambiguity during active certificate lookup before revoke. The passing run reported PNG upload PASS, JPEG replacement PASS, PDF replacement PASS, revoke PASS, residual cleanup PASS, residual DB rows 0, residual R2 objects 0, dev/test DB test data mutation true, dev/test R2 mutation true, production mutation false, and schema migration false.
- System-admin signup review foundation is implemented at `/system/signup-applications` and `/system/signup-applications/[applicationId]` with actual-active-system-admin guards, bounded pagination, consent evidence display, certificate inline viewer route wiring, submitted -> reviewing, submitted/reviewing -> changes_requested, and submitted/reviewing -> rejected compare-and-set transitions. The matching `/api/system/signup/applications` APIs use same-origin mutation guards and safe error codes. Live certificate viewer UI wiring is present, but browser viewer QA remains `NOT_RUN`.
- Approval/provisioning foundation now includes a PostgreSQL provisioning port and repository that performs application `FOR UPDATE`, server-side eligibility checks, Google-sub user reuse with email-only merge denial, company creation, first company-admin user/member/permissions, Trial subscription, certificate company-file ownership link, application approved/idempotency fields, and audit insert inside one logical transaction. Failure recording uses a safe provisioning_failed marker outside the rolled-back transaction only after execution starts.
- `/api/system/signup/applications/[applicationId]/provisioning-plan` exposes a system-admin-only dry-run plan with no DB mutation. `/api/system/signup/applications/[applicationId]/approve` is wired to the service/port but defaults to blocked unless non-production runtime, `WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING=1`, and exact confirmation `RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST` are all present.
- Approval UI now shows dry-run provisioning plan details and a safe execution-gate check. The client does not send the actual confirmation phrase, so real company/user/member/subscription provisioning remains blocked in the browser unless the guarded server-side dev/test execution path is explicitly used.
- A guarded dev/test approve provisioning integration runner is implemented as `scripts/run-signup-approval-provisioning-integration.mjs` and PowerShell menu 46. It requires non-production runtime, approved DB fingerprint, `WAFL_DB_AUDIT_APPROVED=1`, `WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING=1`, and exact confirmation `RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST`; it uses dedicated `signup-approval-it` synthetic fixtures only, performs no R2 mutation, and cleanup must end with residual DB rows 0.
- Actual dev/test approve provisioning integration PASS was confirmed after preserving existing Google-sub user `company_id`/`role`, adding CAS rowCount checks, preparing created IDs before the final approved/completed transition, and fixing cleanup order for approved application FK/check constraints. The passing run reported new applicant PASS, idempotency PASS, identity conflict PASS, existing user reuse PASS, Trial PASS, applicant workspace PASS, residual DB rows 0, residual R2 objects 0, dev/test DB fixture mutation true, production mutation false, and schema migration this run false.
- Notification email and live certificate viewer browser QA remain not run in this foundation handoff. PG/billing operation remains reserved for 0.24.31.
- Required signup consent evidence is represented by the separate additive migration `db/migrations/patch_0_24_26_signup_application_consents.sql`; this migration was executed once against the approved dev/test DB fingerprint after compatibility audit findings 0.
- Signup OAuth callback failures for signup now redirect to `/pending?type=signup&error=<safe-code>` and do not expose raw provider details.

### 0.24.26 Dev/Test Migration Evidence

- Executed migration file: `db/migrations/patch_0_24_26_signup_applications.sql`.
- Migration SHA-256: `b0f83b1026891099a65ae1b8e57f6269db52e00d1d9c6066b1b227039f16a395`.
- Executed additive consent migration file: `db/migrations/patch_0_24_26_signup_application_consents.sql`.
- Consent migration SHA-256: `7b6f1f7f220925b0090c6765222d0805b5a9cfd40615c4648dbae2f9f3fe5eea`.
- Execution runtime/fingerprint: `development`, approved DB fingerprint `01e5dcc7fea3`.
- Execution time: `2026-06-29 00:34 KST`.
- Production migration: none.
- Created schema: `public.signup_applications`, `public.signup_application_files`, related PK/FK/check constraints, and planned indexes.
- Created additive consent schema: `public.signup_application_consents`, related FK/check constraints, `signup_application_consents_application_idx`, and `signup_application_consents_active_type_unique`; duplicate `signup_application_consents_active_version_unique` is intentionally absent.
- Preflight compatibility audit: PASS, total compatibility findings 0.
- Migration apply: PASS, single SQL file only, exit code 0.
- Consent migration apply: PASS, single additive SQL file only, exit code 0.
- Post-apply read-only schema audit: PASS, total compatibility findings 0, transaction rolled back.
- Consent post-apply read-only schema audit: PASS, total compatibility findings 0, transaction rolled back.
- Schema smoke rollback: PASS, transaction rolled back.
- Consent rollback smoke: PASS, transaction rolled back, residual rows 0.
- Smoke row residue: 0 by post-apply read-only audit.
- DB mutation scope: schema migration only; no business data seed/backfill/provisioning rows.
- R2 mutation: 0 for schema migrations; later approved certificate integration attempts created no lasting R2 objects and ended with residual R2 objects 0.
- `4. Newest` remains reserved for latest full source ZIP and matching repo-state only; DB audit logs are stored under `C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\DB_Audit\`.
- Latest repo-state must distinguish DB Migration Applied, previous DB Schema Mutation, Schema Migration This Run, Dev/Test DB Test-Data Mutation, Dev/Test R2 Mutation, Production Mutation, and Production Migration. For this foundation, DB schema mutation is true only for the previously approved dev/test signup and consent schema migrations; the certificate integration run has schema migration false, dev/test DB test-data mutation true with residual rows 0, dev/test R2 mutation true with residual objects 0, production mutation false, and production migration false. The approve provisioning integration run has schema migration false, dev/test DB fixture mutation true with residual rows 0, dev/test R2 mutation false with residual objects 0, production mutation false, and production migration false.
- 0.24.26 is ready for commit/push handoff after final validation and menu 7 handoff artifact generation. 0.24.27 must not start until this handoff is complete.

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
