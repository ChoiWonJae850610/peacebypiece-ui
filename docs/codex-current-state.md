# Codex Current State — 0.24.22

## Active execution gate

- Current version: `0.24.22`.
- Next implementation version: `0.24.23` only after 0.24.22 result confirmation.
- Current work result: **Sprint A — Database Foundation and Authority Alignment** read-only evidence captured.
- Next work: **Sprint B — Source Architecture Cleanup** after confirmation.
- Single active execution authority: `docs/project/31-pre-codex-integrated-master-plan.md`.
- Authority consistency gate: `docs/project/32-pre-codex-authority-consistency-gate.md`.
- Final owner policy: `docs/project/26-final-policy-decisions-and-master-todo.md`.
- DB audit and migration design: documents 27, 28, and 29.

The active dependency order is:

`DB Foundation → Source Architecture Cleanup → WAFL UI Foundation → Authorization/Runtime/Opaque Routing → Signup/Trial → Catalog/Size/POM → PDF/R2 → Export → Storage/Termination/Deletion → PG Billing → Operations/Security/Launch QA`

Any older document that describes `0.24.22` as an UI-first Sprint, PB-005/006/010 implementation, or a no-DB-authority-change UI boundary is historical and superseded.

## Mandatory start rules

1. Read `AGENTS.md`, this file, document 26, document 31, then the target Sprint specifications.
2. Do not broaden the current Sprint without stopping and recording the newly discovered dependency.
3. Do not execute production DB/R2/PG mutations without separate explicit approval.
4. Any DB change requires read-only reconciliation, deployed-schema drift evidence, dry-run, rollback steps, and a separate migration boundary.
5. Before 1.0, `master` remains the single development/QA branch. After local/build/contract checks pass, commit and push to `origin/master` for Vercel real-device QA.
6. Preserve `/id-control` and the system-admin/test-company role switcher for dev/test QA. Keep original-session restore and audit logging. Block all of it in production.
7. New audit, migration, seed, reset, cleanup, PDF, R2, Export, performance, or E2E commands that should be operator-accessible must be tracked for the existing PowerShell menu with menu number, safety classification, confirmation requirement, and environment restriction.

## 0.24.22 result boundary

0.24.22 was executed as an evidence-first DB Foundation Sprint. It:

- traced membership, plan/subscription, workorder ID, attachment/trash/deletion, and tenant/RLS authority through documents 27/28/31/32 and the 0.24.22 roadmap contract;
- ran the read-only menu 30–32 reports against the approved dev/test DB fingerprint;
- recorded source-of-truth, conflict, backfill, migration, rollback, and GO/STOP boundaries;
- avoided unrelated UI implementation and avoided destructive migration execution.

Read-only DB audit result:

- Menu 30 DB Schema Reconciliation Audit: PASS, total result rows 0.
- Menu 31 DB Constraint Readiness Check: PASS, total reported issues 0.
- Menu 32 DB Index Usage/Query Readiness Report: PASS, total result rows 430 as a report.
- Production DB/R2 mutation: 0.
- Schema migration/backfill/RLS DDL execution: none.
- Commit/push evidence: `753ba58671a81227588556bc6cfc22c35343c993` pushed to `origin/master`; latest handoff files generated in `4. Newest`.

0.24.23 must not start until the owner confirms the 0.24.22 DB authority and migration boundary report.

If safe schema changes are proven necessary, split them into separately reviewed migration versions rather than silently applying them inside an unrelated patch.

## Runtime and product preservation

- Public website scope remains in the plan: `www.wafl.co.kr`, root-to-www redirect, pricing, Trial CTA, inquiry/policy links, signup/login, and post-login app routing.
- `/id-control` is not dead code. It is a dev/test QA facility and must remain production-blocked.
- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by environment-name strings.
- `/id-control` test account switching is allowed only for the active system administrator with allowlisted targets, original-session restore, signed context, and audit logging.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- The canonical verification profile for this boundary remains `system-admin-internal-access`.
- System administrators must not gain access to customer operational content; the business-certificate approval viewer remains the narrow exception.
- Existing role, workflow, PDF, DB, and R2 semantics must not be changed during architecture cleanup without target tests and explicit Sprint scope.

## Deferred dependencies

- PG provider and final payment-provider wording: after business registration/provider selection.
- Analytics and Cookie consent: post-Codex TODO.
- Instagram operating strategy: post-Codex TODO.
- Final legal, tax, processor, overseas-transfer, and operator identity wording: pre-launch review.

## Required completion gate for every Sprint

- TypeScript and production build pass.
- Applicable contract, E2E, tenant, permission, mutation, Unicode, and secret checks pass.
- No unapproved package/lockfile changes.
- Documentation and roadmap match actual implementation.
- `master = origin/master`, working tree clean.
- Vercel deployment and PC/mobile/tablet real-device QA complete.

## Pre-Codex Final Contract Gate

- PowerShell 경로: `5. 개발 / 테스트 도구` → `33. Pre-Codex Final Contract Gate`
- 안전 등급: 읽기 전용·비파괴·DB/R2 변경 없음
- 실행 계약: document structure, workspace commonization, system-admin internal access, roadmap development, Unicode encoding
- 별도 build 확인: `5` → `2. NPM Build`
