# Productization Roadmap Authority

> Active baseline: `0.24.27`. Current implementation candidate: `0.24.27` System Catalog, Sizes, and POM.
> The only active Sprint sequence is `docs/project/31-pre-codex-integrated-master-plan.md`.
> Structured canonical source: `lib/internal/roadmap/`.
> Runtime roadmap index: `lib/internal/roadmap/index.ts`.

## Status

- Roadmap checkpoint version: `0.24.27`
- APP_VERSION: `0.24.27`
- Feature implementation progress: about `95%`
- Productization readiness: about `86%`
- Current-state handoff: `docs/codex-current-state.md`
- System-admin screen: `/roadmap`
- Current planning policy: before 1.0, `master` remains the single development/QA branch and Vercel deployment is used for real-device QA.

## Active Sprint Sequence

1. `0.24.22` - DB Foundation and Authority Alignment
2. `0.24.23` - Source Architecture Cleanup
3. `0.24.24` - WAFL UI Foundation
4. `0.24.24.1` - Simulator Attachment/R2 Lifecycle Integration
5. `0.24.25` - Authorization, Runtime Boundary, and Opaque Routing
6. `0.24.25.1` - /id-control Read-only Account List Regression Fix
7. `0.24.25.2` - /id-control Production QA Impersonation Allowlist
8. `0.24.25.3` - /id-control Runtime-independent System-admin Impersonation
9. `0.24.25.4` - Policy Mismatch Correction for System-admin Boundary, Certificate Viewer, and Trial
10. `0.24.26` - Public Signup, Verification, Approval, and Trial
11. `0.24.27` - System Catalog, Sizes, and POM
12. `0.24.28` - PDF and R2 Lifecycle
13. `0.24.29` - Company-wide Export
14. `0.24.30` - Storage Enforcement, Termination, and Automatic Deletion
15. `0.24.31` - PG Billing and Subscription Operations

## 0.24.25.4 - Policy Mismatch Correction for System-admin Boundary, Certificate Viewer, and Trial

- System-admin internal APIs validate the actual signed-in active system-admin actor, including during `/id-control` customer impersonation.
- Workspace/customer APIs continue to use the effective impersonated role and permission scope.
- Business-certificate approval viewer download mode is blocked by the server route.
- Trial constants are aligned to 7 days, 100MB, and 3 members.
- `/id-control` options loading has an explicit safe error/retry state.
- No DB migration, DB/R2 mutation, package/lockfile change, Cloudflare Worker change, or 0.24.26 public signup implementation is included.
- Commit result: `7162f1a95b73cc1f995b47675d38337527c255cb`.
- Verification result: targeted ESLint, `tsc --noEmit`, system-admin actual/effective session contract, system internal access contracts, certificate approval viewer no-download contract, Trial policy contract, dev-test-context system-admin contract, id-control error-state contract, authorization runtime boundary contract, workspace member session guard contract, unicode encoding contract, `next build`, `git diff --check`, and `git diff --cached --check` passed.
- Remaining manual QA: Vercel PC/mobile actual/effective session, `/id-control` switch/restore, direct customer login system route blocking, business-certificate inline viewer and `download=1` blocking, and Trial 7 days/100MB/3 members UI display.

## 0.24.26 - Public Signup, Verification, Approval, and Trial

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.26.ts`.
- First preparation note: `docs/project/33-public-signup-schema-repository-prep-0.24.26.md`.
- This entry is complete for the committed foundation scope: canonical roadmap, signup schema migration foundation, PostgreSQL repository/API/session foundation, Google email_verified handling, pending workspace guard foundation, normal-session precedence over stale applicant cookies, public signup draft/status UI, consent evidence API/UI foundation, certificate API/UI/service foundation, guarded certificate R2 integration, system-admin signup review list/detail foundation, approval provisioning repository/API/UI gate, and guarded dev/test approve provisioning integration.
- Scope includes public signup CTA, Google OAuth with `email_verified=true`, unjoined verified-user state, new-company application, invitation/code-first existing-company join, join_requests/invitations reuse, system-admin approve/reject/correction request, pending/rejected limited screens, pre-approval `/workspace` and API blocking, approval-time company/user/company_member/role-permission/company_subscription/Trial/quota/audit/business-certificate ownership linking, idempotency, audit, IDOR defense, duplicate prevention, email normalization, and signup abuse controls.
- Trial values are fixed at 7 days, 100MB storage, and 3 members, and Trial starts at system-admin approval.
- Business certificate is required for production new-company applications; dev/test fixture exceptions must be explicitly guarded.
- Business certificate access remains approval-viewer-only with no WAFL-provided download path.
- Card registration, payment-method readiness, PG-neutral payment references, PG charge, and subscription operations remain 0.24.31; 0.24.26 must not store raw card data, fake card placeholders, fake payment references, or PG-neutral payment references.
- System catalog, size, and POM row provisioning moves to 0.24.27 and must not be backfilled into existing companies automatically.
- The signup schema migration was separately approved and executed once against the approved dev/test DB only; production migration and any additional schema/data/R2 mutation still require separate approval, read-only reconciliation, dry-run evidence, and rollback planning.

## 0.24.27 - System Catalog, Sizes, and POM

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.27.ts`.
- Scope includes the additive system catalog schema, three-level apparel catalog defaults, underwear/accessory default-inactive catalog entries, size-set foundation, POM definition foundation, company catalog activation records, company-admin category activation UI/API, new-company signup approval provisioning linkage, read-only compatibility/post-apply audits, and guarded dev/test provisioning integration.
- Existing companies are not automatically changed by migration or background backfill. Any future existing-company dry-run/backfill remains a separate explicitly approved operation.
- Production migration, production DB/R2 mutation, Cloudflare Worker mutation, notification sending, PG/billing operations, and 0.24.28 PDF/R2 work remain excluded.

## Reserved Future Dependencies

### 0.24.28 - PDF and R2 Lifecycle

- Reserved scope: actual R2 lifecycle simulator completion, valid PNG/JPEG/PDF fixtures, representative design file, multiple attachments, trash, restore, permanent delete, GET 404 verification, missing R2 handling, exact-key orphan audit, manifest-scoped reconciliation, upload-success/DB-failure rollback, PDF cleanup/regenerate, PowerShell menu/docs/contracts cleanup, production mutation ban, and exact scope confirmation.
- Bounded performance fixture only: small thumbnail, 1MB image, 5MB image, 10MB PDF, and limited multiple attachments.
- Explicitly excluded: actual tens-of-GB R2 fixture creation and broad prefix/bucket delete.

### 0.24.30 - Storage Enforcement, Termination, and Automatic Deletion

- Reserved capacity profile: 0%, <1%, 10%, 20%, 30%, 50%, 70%, 90%, 99%, 100%, and 110%.
- Reserved scope: plan-specific storage limits, Trial 100MB linkage, DB capacity snapshot profile, visual fill clamp 0~100%, exact text percentage, over-limit display, remaining capacity, trash inclusion policy, upload preflight enforcement, concurrent quota race, warning threshold, grace period, termination, automatic deletion scheduling, cancellation/recovery, capacity apply/verify/restore commands, production mutation blocking, and dev/test exact confirmation.
- Future PowerShell menu names may include Simulator Storage Capacity Plan/Apply/Verify/Restore and Simulator R2 Performance Fixture Plan/Execute/Cleanup, but menu numbers must be assigned only after checking the latest pipeline menu for conflicts.

### Capacity Fixture Backlog

- Current H/I/J fixture expectations are not canonicalized by mutation in this step; for example DB scenario H is 99% while the attachment capacity manifest H is about 70~80%.
- Lifecycle fixture, capacity fixture, and performance fixture must remain distinct fixture classes.
- Future 0.24.30 should prefer a profile apply approach over permanently assigning every capacity boundary to A~J companies.

## 0.24.25.3 - /id-control Runtime-independent System-admin Impersonation

- `/id-control` switch/clear action no longer requires server dev/test runtime or action environment flags.
- Active system administrator, system-admin allowlist, seed/test target allowlist, and switch/restore audit logging remain required.
- Options API remains the single source of truth for button enabled/disabled state.
- Arbitrary user id, company id, role input, general customer accounts, inactive system admins, and non-allowlisted system admins remain blocked.
- Seed, Reset, Cleanup, DB/R2 mutation, DB migration, Purge, and destructive simulator guards are unchanged.
- No DB migration, DB/R2 mutation, package/lockfile change, or Cloudflare Worker change is included.
- This patch does not start 0.24.26.

## 0.24.25.2 - /id-control Production QA Impersonation Allowlist

- 0.24.25.2 originally added a production QA action gate, but this was superseded by the 0.24.25.3 runtime-independent system-admin impersonation policy.
- `/id-control` buttons use `/api/dev/test-context/options` as the single source of truth for action enabled/disabled state.
- Target listing remains read-only and active-system-admin-only even when actions are disabled.
- Targets remain limited to existing seed/test targets returned by `buildDevTestContextOptions`; arbitrary production customer ids are not accepted.
- Switch and restore audit logging remains in place and does not log raw cookie payloads, tokens, secrets, or signed URLs.
- No DB migration, DB/R2 mutation, package/lockfile change, or Cloudflare Worker change is included.
- This patch does not start 0.24.26.

## 0.24.25.1 - /id-control Read-only Account List Regression Fix

- Restores active system-admin read-only target listing on `/id-control` after the 0.24.25 runtime boundary hardening.
- `/api/dev/test-context/options` builds account targets before evaluating whether switch/clear actions are enabled.
- Production and flag-disabled runtimes still return `devTestContextEnabled: false` and keep switch/clear actions blocked.
- General users and customer accounts remain blocked from `/id-control`.
- `4. Newest` is cleaned to exactly two files: the latest full source ZIP and matching repo-state TXT.
- No DB migration, DB/R2 mutation, package/lockfile change, or Cloudflare Worker change is included.
- This patch does not start 0.24.26.

## 0.24.25 - Authorization, Runtime Boundary, and Opaque Routing

- Server-side permission checks now own app route authorization; app routes no longer use the legacy header-preview permission guard.
- Dev/test account switching originally required server non-production runtime and an action flag; this was superseded by the 0.24.25.3 policy for `/id-control`.
- Workorder direct route parameters are validated through an opaque-compatible common validator before repository access.
- Missing, malformed, cross-company, and inaccessible workorder/attachment resources use common WAFL not-found/permission states with reduced information exposure.
- Attachment file proxy access now requires `storage.read`, company prefix match, and active DB attachment metadata for the requested storage or thumbnail key.
- R2 client error logs avoid endpoint, bucket, raw key, signed URL, token, and secret output.
- No DB migration, DB/R2 mutation, package/lockfile change, or Cloudflare Worker change was included.
- Operations dashboard PLAN AND STORAGE / policy 기준 / member status UI cleanup was deferred because it is outside the official Sprint D security boundary.
- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by environment-name strings.
- `/id-control` test account switching is allowed for active system administrators regardless of runtime/env action flags.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- Verification profile reference: `system-admin-internal-access`.

## 0.24.24.1 - Simulator Attachment/R2 Lifecycle Integration

- Added a canonical simulator attachment manifest for normal lifecycle fixtures.
- Separated normal realistic attachment/R2 fixtures from capacity boundary fixtures.
- Added dev/test Neon/R2 fingerprint guard and preflight reporting structure.
- Added PowerShell menu 34~41 for attachment plan, local generate, upload/seed, verify/reconcile, lifecycle, cleanup, and fault fixture boundaries.
- Added simulator attachment manifest and lifecycle contracts to the functions-automation verification profile.
- Initial 0.24.24.1 implementation was a non-destructive foundation stage and did not execute actual Neon DB mutation, actual R2 upload/delete, lifecycle mutation, cleanup, fault creation, DB migration, production access, package change, or lockfile change.
- Later approved dev/test execution performed attachment upload/seed, verify/reconcile, and actual R2 PUT/GET verification.
- Later approved dev/test execution created valid PDF/PNG/JPEG fixtures, confirmed G PDF restore, and confirmed manifest-scoped reconciliation issue count 0.
- Production DB/R2 mutation remained 0.
- Broad prefix/bucket delete was not executed.

## 0.24.24 - WAFL UI Foundation

- Added shared `components/common/ui/WaflStorageUsageMeter.tsx`.
- Applied the shared storage usage meter to the customer administrator main dashboard and file storage plan card.
- Reduced `/workspace` dashboard card height and avoided forced 3-column layout before wide desktop.
- Verified `/worker` remains on the existing `WorkOrderWorkspace` route and keeps WAFL empty/loading state panels.
- Did not change permission, tenant, workflow, API, repository, DB, R2, PDF, package, or lockfile behavior.
- Manual PC/mobile/tablet visual confirmation remains required before 0.24.25 starts.

## 0.24.23 - Source Architecture Cleanup

- Measured oversized source files and responsibility hotspots.
- Split `WorkOrderDrawingCanvasEditor` canvas primitive/helper/type/icon responsibility into `workOrderDrawingCanvasPrimitives.tsx`.
- Recorded duplicate repository/service boundaries, dead/mock/fallback candidates, legacy PDF Worker status, TypeScript/API/DB risks, and logger/redaction baseline in `docs/audits/source-architecture-cleanup-0.24.23.md`.
- Did not change permission, tenant, workflow, DB, R2, PDF policy, package, or lockfile behavior.

## 0.24.22 - DB Foundation and Authority Alignment

- Ran approved dev/test read-only DB audit menus 30, 31, and 32.
- Menu 30 reconciliation: PASS, total result rows 0.
- Menu 31 constraint readiness: PASS, total reported issues 0.
- Menu 32 index readiness: PASS, total result rows 430 reporting-only.
- Confirmed source-of-truth, migration/backfill/rollback, RLS/tenant boundaries.
- Did not run production DB/R2 mutation, destructive migration, schema/package/lockfile change.

## Canonical Policy

Before starting a new version feature task, read the canonical detail in `lib/internal/roadmap/` and the current state in `docs/codex-current-state.md`.

If user chat, old handoff files, archived docs, and current roadmap/current-state conflict, prefer:

1. local Git state
2. `lib/internal/roadmap/*`
3. `docs/codex-current-state.md`
4. `docs/project/*`
5. archived historical documents

Do not expand a roadmap detail beyond its declared scope. If success conditions cannot be met, do not mark the item complete.

UI, responsive, and PDF work stays in user-confirmation-needed status until human review is complete, even if automatic tests pass.

## Historical Roadmap Index Tokens

The following historical tokens are kept for roadmap contract compatibility. They are not the active execution order when they conflict with document 31.

- `0.24.12` - historical roadmap expansion and internal read-only routes baseline
- `0.24.13` - 臾몄꽌/?대뜑 ?뺣━ 2李?
- `0.24.14` - Functions 90% 援ы쁽/寃利??뺣━
- `0.24.15` - WAFL Productization Audit
- `0.24.16` - Codex/GPT ?쒗뭹???댁쁺 臾몃㎘ 援ъ텞
- `0.24.17` - ?뚯뒪 由ы뙥?곕쭅 1李?
- `0.24.18` - ?쒗뭹??湲곗? 臾몄꽌 ?뺤젙
- `0.24.19` - PDF/R2 ?뺤콉 諛?PDF ?앹꽦 援ъ“
- `0.24.20` - Release Engineering 諛?QA 湲곗?
- `0.24.21` - PB Breakdown 諛?Codex Ready Queue

Normal UTF-8 titles:

- `0.24.13` - 문서/폴더 정리 2차
- `0.24.14` - Functions 90% 구현/검증 정리
- `0.24.15` - WAFL Productization Audit
- `0.24.16` - Codex/GPT 제품화 운영 문맥 구축
- `0.24.17` - 소스 리팩터링 1차
- `0.24.18` - 제품화 기준 문서 확정
- `0.24.19` - PDF/R2 정책 및 PDF 생성 구조
- `0.24.20` - Release Engineering 및 QA 기준
- `0.24.21` - PB Breakdown 및 Codex Ready Queue

0.24.13 이후 roadmap은 기존 기능 계획을 취소하지 않고 재배치하는 방식으로 정리되었다. Vercel 배포본은 운영이 아니라 실기기 QA 환경이라는 기준은 1.0 전까지 유지한다.
