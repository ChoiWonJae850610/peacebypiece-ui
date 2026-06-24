# Pre-Codex Integrated Productization Master Plan

Version: 0.24.21.16  
Status: Final execution plan before Codex implementation  
Execution baseline: `0.24.22` and later  
Scope: confirmed policy, DB audit, source audit, missing features, operations, security, QA, launch dependencies

## 1. Purpose

This document is the single execution plan Codex must follow before and during the remaining pre-1.0 productization work. It integrates five inputs that were previously split across multiple files:

1. final owner policy decisions,
2. database schema/query/permission audit,
3. database source-of-truth and safe-migration design,
4. source architecture and product-completeness audit,
5. confirmed but not-yet-implemented product and launch requirements.

Codex must not treat the old UI-first Sprint order as current. The implementation sequence below supersedes the earlier Sprint A~F order in document 23.

## 2. Canonical inputs

Read in this order before implementation:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. this document
5. `docs/project/27-database-schema-query-permission-audit.md`
6. `docs/project/28-database-source-of-truth-safe-migration-design.md`
7. `docs/project/30-pre-codex-policy-reconciliation.md`
8. topic specification for the target Sprint
9. `docs/project/12-release-engineering.md`
10. `docs/project/13-qa-matrix.md`
11. `docs/project/14-playwright-plan.md`
12. `docs/project/15-browser-device-matrix.md`

## 3. Global implementation rules

- Before 1.0, `master` remains the single development and QA branch.
- After local/build/contract checks pass, commit and push to `origin/master` so Vercel can deploy for real-device QA.
- Every Sprint must follow: Inspect → Plan → Implement → Verify → Commit/Push → Vercel QA → Fix regressions.
- Do not mix destructive schema migration, data backfill, production mutation, and unrelated UI work in one version.
- Any DB change requires read-only reconciliation, dry-run evidence, rollback steps, and a separate migration boundary.
- Any newly discovered schema or permission-contract requirement outside the current Sprint is a stop condition.
- New production mock/demo fallback paths are forbidden.
- New duplicate repository/service layers are forbidden.
- A new source file above 50KB requires an explicit split rationale and follow-up ticket.
- Every mutating API requires tenant scope, permission check, validation, audit metadata, and regression tests.
- Customer content must never enter general operational logs.

## 4. Cross-cutting completion gate for every Sprint

A Sprint is not complete unless all applicable items pass:

- TypeScript and production build.
- Existing contract tests and newly added target contracts.
- Tenant/permission regression tests.
- DB/R2 mutation audit with no unexplained high-risk mutations.
- Unicode/filename contract.
- No package or lockfile changes unless explicitly approved.
- Documentation and roadmap updated to actual implementation status.
- `master = origin/master`, working tree clean.
- Vercel deployment and PC/mobile/tablet smoke check.

## 5. Integrated Sprint sequence

### 0.24.22 — Sprint A: Database Foundation and Authority Alignment

Goal: remove ambiguity in the data model before adding new commercial workflows.

Scope:

- Trace all reads/writes for `users`, `company_users`, and `company_members`.
- Establish `users` as identity and `company_members` as customer membership/role source of truth.
- Keep `company_users` only as a compatibility boundary until verified migration/removal.
- Establish `plans` as catalog and `company_subscriptions` as current subscription state.
- Restrict `company_plan_assignments` to explicit override/history semantics.
- Classify duplicate plan/quota fields on `companies` as cache, compatibility, or removal candidates.
- Separate technical PK from stable opaque workorder URL ID design.
- Clarify `attachments`, trash/deletion job, and deletion evidence responsibilities.
- Inventory tenant-owned tables and deployed RLS state.
- Add reproducible RLS/tenant policy design where missing.
- Review current 270-index deployed inventory against actual query patterns; do not add indexes by default.
- Produce staged migration/backfill/rollback plan for any required schema changes.

Required evidence:

- menus 30, 31, 32 read-only reports,
- source-of-truth matrix,
- deployed schema drift report,
- EXPLAIN evidence for index changes,
- IDOR/tenant contract plan.

Stop conditions:

- reconciliation finds conflicts,
- deployed schema differs materially from repository schema,
- migration requires destructive cleanup without a verified mapping,
- production DB access is required.

### 0.24.23 — Sprint B: Source Architecture Cleanup

Goal: reduce structural debt before feature expansion.

Scope:

- Split oversized files and mixed responsibilities, prioritizing `WaflUiCatalogPage`, `AdminSettingsHub`, `joinRequestRepository`, workorder route handlers, large drawing/editor modules, and oversized i18n bundles.
- Consolidate duplicate repository/service/route logic.
- Remove dead routes, dead components, unused helpers, and deprecated compatibility code after evidence.
- Identify and remove production mock/demo/fallback paths.
- Make legacy schema fallbacks observable and scheduled for removal.
- Align TypeScript, DB row types, validation schemas, repository returns, and API response contracts.
- Centralize logger, correlation ID, redaction, allowed metadata, and retention classification.
- Select one canonical PDF renderer; production fallback generation must not silently switch renderers.
- Review deprecated Cloudflare PDF Worker and remove only after replacement evidence.

Stop conditions:

- runtime behavior or data semantics would change without tests,
- a supposedly dead path has active production references,
- schema migration becomes necessary.

### 0.24.24 — Sprint C: WAFL UI Foundation

Goal: finish the previously planned productization UI pass on a cleaner architecture.

Scope:

- Customer administrator dashboard, members, company settings/files WAFL commonization.
- `/worker`, `/workspace`, and administrator dashboard information-density reduction.
- Functions environment/profile/safety/dry-run/impact presentation.
- Cylindrical storage usage presentation.
- Remove duplicate image/certificate labels and status badges.
- Standardize empty/loading/error/permission states.
- Mobile/tablet drawers, modals, tables, fixed actions, and horizontal overflow.
- Keep all role, workflow, and DB semantics unchanged.

### 0.24.25 — Sprint D: Authorization, Runtime Boundary, and Opaque Routing

Goal: harden tenant isolation and operational boundaries.

Scope:

- Full API/route company-scope audit.
- IDOR tests using other-company identifiers.
- Enforce permission checks server-side, never UI-only.
- Add stable opaque workorder URL identifier with compatibility and backfill plan.
- Direct-link/refresh/back-navigation behavior.
- Restrict system administrator customer-content access.
- Allow business-certificate view only in the approval viewer; block download.
- Verify all dev/test pages, account switching, reset/seed/simulator functions are production-blocked.
- Add CSP, HSTS, frame, content-type, referrer, permissions, sensitive-cache, cookie, and CSRF review.

### 0.24.26 — Sprint E: Public Signup, Verification, Approval, and Trial

Goal: implement self-service commercial onboarding without PG-specific payment execution.

Scope:

- Public WAFL signup and login entry.
- Email verification.
- Company/admin/plan/card-reference request model.
- Business number API result display plus manual certificate comparison.
- Approval-only viewer, no download.
- Correction request email with 3-day deadline and automatic rejection.
- Signup approval target evidence for one business day.
- Approval triggers Trial immediately: 7 days, 100MB, 3 members.
- Immediate, 3-day, and 1-day billing notices.
- Idempotent company/admin/catalog/quota provisioning and retry.
- PG-neutral payment-method interface only until provider selection.

### 0.24.27 — Sprint F: System Catalog, Sizes, and POM

Goal: provide production-ready system defaults and customer customization.

Scope:

- Three-level apparel catalog.
- Default active apparel groups.
- Underwear and accessories provided but disabled by default.
- Customer enable/disable and custom category creation.
- Body circumference, half-flat, quarter-pattern-reference, and length measurement types.
- cm/inch unit selection and supported inch fractions.
- Women 55/66/77, men 90/95/100/105, XS~XL base systems.
- POM definitions and measurement-location illustrations.
- System-admin management of defaults.
- Idempotent new-company seed and existing-company dry-run backfill.

### 0.24.28 — Sprint G: PDF and R2 Lifecycle

Goal: make PDF the dependable customer deliverable.

Scope:

- Incomplete workorder PDF.
- Final workorder PDF.
- Supplier order PDF at order request.
- Final PDF generation rules based on related purchase-order completion.
- Latest final PDF only; no historical file or metadata retention.
- Incomplete watermark, status badge, and missing-item list.
- Previous normal PDF remains available when regeneration fails.
- Customer retry button.
- Operator alert on first failure.
- Private R2 object lifecycle, safe replacement, quota accounting, trash/purge, reconciliation.
- Mobile download and KakaoTalk file-forwarding QA.

### 0.24.29 — Sprint H: Company-wide Export

Goal: provide complete and predictable customer data portability.

Scope:

- CSV, JSON, original attachments, current PDFs in foldered ZIP.
- Necessary work history only; user names allowed, emails and sensitive detailed history excluded.
- Deleted-data history excluded.
- Async generation.
- 500MB split archives.
- Login-only link, 7-day expiry.
- Expired ZIP deletion.
- Count usage only after successful generation.
- Normal PDF download remains unlimited.
- Final termination Export once, separate from plan limit.

### 0.24.30 — Sprint I: Storage Enforcement, Termination, and Automatic Deletion

Goal: enforce quota and deletion policy consistently and safely.

Scope:

- At 100% storage: allow existing view/text edit/delete/trash-empty/upgrade.
- Block new workorder, reorder, stage transitions, upload, file replacement, drawing edit that creates a file, and PDF regeneration.
- Recalculate DB/R2 usage after deletion.
- Termination flag and 30-day view/export/recovery mode.
- Immediate recovery within 30 days, including delinquent account after payment.
- One-day deletion warning.
- KST deletion boundary: 30th day 00:00.
- Separate legal evidence, then automatically delete customer content and personal data.
- Retry deletion hourly.
- First failure is a critical operator incident.
- Completion email and deletion evidence.

### 0.24.31 — Sprint J: PG Billing and Subscription Operations

Dependency: business registration and PG/provider selection.

Scope:

- Card billing key/token lifecycle.
- Trial-end automatic billing.
- Idempotent webhook processing.
- Payment success/failure/refund evidence.
- Retry at day 0, 3, 7, 14, 21, and 30.
- Day-7 creation/upload restrictions and day-30 termination.
- Duplicate/system-error charge refund.
- No refund for customer non-use.
- Major WAFL outage compensation by service-period extension unless law/PG policy requires refund.
- Upgrade immediate with prorated charge.
- Downgrade immediate with prorated refund only when limits are already satisfied.
- Block downgrade while storage/member limits exceed target plan.
- Customer billing history and operator failure queue.

### 0.24.32 — Sprint K: Operations, CI, Security, and Launch QA

Goal: reach commercial launch readiness.

Scope:

- Unified signup/payment/export/PDF/deletion/inquiry queues.
- Inquiry states: received, processing, answered; one-business-day warning.
- Serious incident email and in-app notice.
- Monitoring for Vercel deploy, API 5xx, DB, R2, email, payment webhook, PDF, export, deletion, and reconciliation.
- Daily operator summary.
- GitHub Actions CI: typecheck, build, contracts, Unicode, secrets scan, migration policy.
- Core Playwright journeys and tenant/permission regression.
- Accessibility, performance, bundle, pagination/virtualization, N+1/query review.
- Backup/restore, RPO/RTO, restoration exercise.
- iPhone, Galaxy, iPad, Galaxy Tab, and PC consolidated QA.
- Production Vercel, DB, R2, secrets, email, DNS, legal/processor disclosure, and launch checklist.

## 6. Deferred but tracked decisions

These do not block 0.24.22:

- PG/provider selection after business registration.
- External analytics.
- Cookie banner/consent if non-essential analytics is added.
- Instagram content format, cadence, public screens, and masking.
- Final legal, tax, processor, and international-transfer wording.

## 7. Release sequencing rule

Version numbers may split when a migration, external dependency, or regression requires a smaller safe boundary. However, the dependency order must remain:

DB authority → source cleanup → UI → authorization/routing → signup → catalog/size → PDF/R2 → Export → deletion/quota → PG billing → launch hardening.

Codex must not skip a prerequisite merely because a later UI is easier to implement.
