# Productization Roadmap Authority

> Active baseline: `0.24.33.1`. Latest completed work: `0.24.33.1` Authenticated Public Signup E2E and Deployed QA Automation. Next planned work: `0.24.34` Workorder Size Specification and Incomplete/Final PDF.
> Structured canonical source: `lib/internal/roadmap/`.
> Runtime roadmap index: `lib/internal/roadmap/index.ts`.

## Status

- Roadmap checkpoint version: `0.24.33.1`
- APP_VERSION: `0.24.33.1`
- Feature implementation progress: about `93%` after reconciling foundation-only work with still-missing product paths
- Productization readiness: about `86%` after restoring Export, deletion, operations, CI, monitoring, and launch work
- Current-state handoff: `docs/codex-current-state.md`
- System-admin screen: `/roadmap`
- Manual QA status: `PENDING_USER_QA`
- Current planning policy: before 1.0, `master` remains the single development/QA branch and Vercel deployment is used for real-device QA.

## Internal Access Boundary

- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`.
- `/id-control` test account switching is allowed for active allowlisted system-admin users and remains unrelated to destructive Seed/Reset/Cleanup operations.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, Purge, and production mutation guards remain unchanged.
- Regression contract: system-admin-internal-access.

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
13. `0.24.29` - Integrated Productization Checkpoint
14. `0.24.30` - Storage Capacity Profiles
15. `0.24.31` - Canonical Policy Conformance Remediation and PG-neutral Billing Foundation
16. `0.24.32` - PG Billing and Subscription Operations
17. `0.24.33` - Public Signup End-to-End UX and System-admin Review Operations
18. `0.24.33.1` - Authenticated Public Signup E2E and Deployed QA Automation
19. `0.24.34` - Workorder Size Specification and Incomplete/Final PDF
20. `0.24.35` - Company-wide Export Execution
21. `0.24.36` - Termination, Recovery, and Automatic Deletion Execution
22. `0.24.37` - Operations, Inquiry, Monitoring, CI, Accessibility, Performance, and Backup/Restore Foundations

## Roadmap Reconciliation After 0.24.33.1

The full implementation audit in `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md` corrects an ambiguity in earlier roadmap wording:

- `completed` means the declared scope of that version was completed.
- It does not mean every higher-level canonical requirement in the domain is complete.
- 0.24.27 completed system size/POM foundation, but not workorder size-spec editing.
- 0.24.28 completed supplier PDF and private R2 lifecycle foundation, but not incomplete/final workorder PDF.
- 0.24.31~0.24.32 completed PG-neutral billing/export/termination foundations, but not live provider execution, full Export packaging, or durable deletion scheduling.
- Historical entries remain as completed evidence; open product paths are restored as explicit future versions rather than rewriting history.

## 0.24.34 - Workorder Size Specification and Incomplete/Final PDF

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.34.ts`.
- Connect active system/company size sets and POM defaults to real workorder editing and persistence.
- Add cm/inch support with deterministic 1/8-inch values.
- Preserve size/POM snapshots through save, copy, and reproduction.
- Add separate incomplete and final workorder PDF types.
- Incomplete PDF: watermark, status badge, missing-item list, current saved snapshot.
- Final PDF: canonical completion eligibility, size/POM pages, latest-only retention, failure-safe replacement, retry/operator evidence.
- Keep supplier `order_request_pdf` separate.
- Require rendered-PDF visual verification and responsive browser coverage.

## 0.24.35 - Company-wide Export Execution

- Build actual dev/test Export packages with CSV, JSON, attachments, and current PDFs.
- Add folder manifest, split archive support, authenticated download, expiry, exact cleanup, plan usage enforcement, and final termination Export readiness.
- Keep production Export separately approved.

## 0.24.36 - Termination, Recovery, and Automatic Deletion Execution

- Add durable due-job execution for recovery windows, deletion warning, KST deletion boundary, exact deletion manifest execution, legal-hold exclusion, retry, operator incident evidence, and completion evidence.
- Keep production deletion separately approved.

## 0.24.37 - Operations, Inquiry, Monitoring, CI, Accessibility, Performance, and Backup/Restore Foundations

- Add inquiry queue and SLA warnings.
- Unify signup/payment/export/PDF/deletion/inquiry operations.
- Add monitoring, daily summaries, GitHub Actions CI, accessibility/performance/query audits, and backup/restore exercises.
- Prepare the consolidated launch checklist without silently enabling external providers or production mutation.

## 0.24.33.1 - Authenticated Public Signup E2E and Deployed QA Automation

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.33.1.ts`.
- Follow-up QA version for the completed 0.24.33 public signup path.
- Adds dev/test applicant, system-admin, and approved company-admin session fixture automation without automating the real Google OAuth screen.
- Adds Playwright browser matrix metadata for Chromium, WebKit, mobile, and iPad plus deployed read-only smoke wiring.
- Registers public signup QA automation coverage in `/functions` with status, profile, command, safety, runtime restriction, and remaining manual QA.
- Verification PASS: `public-signup-authenticated-e2e`, Chromium/WebKit/mobile/iPad browser matrix, deployed smoke, residual audit, and certificate PNG/JPEG/PDF/revoke integration.
- Keeps actual PG integration, actual email delivery, production mutation, Worker source change, Worker deployment, and 0.24.34 implementation out of scope.

## 0.24.33 - Public Signup End-to-End UX and System-admin Review Operations

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.33.ts`.
- Connects `/signup`, applicant dashboard, system-admin signup queue/detail, dev/test payment-readiness controls, approval, Trial provisioning, and approved workspace entry into a QA-ready path.
- Uses application-scoped payment readiness before company creation, then copies safe provider-neutral evidence to company billing references during approval.
- Keeps actual PG integration, actual email delivery, production customer mutation, and Worker deployment out of scope.

## 0.24.32 - PG Billing and Subscription Operations

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.32.ts`.
- Builds on audit: `docs/audits/0.24.31-canonical-policy-conformance-audit.md`.
- Additive persistence: payment readiness, billing lifecycle state, invoice, payment attempt, transaction, refund, subscription change, retry schedule, event, webhook interface, notification outbox, company export, termination, and recovery tables.
- Operations: signup approval payment-readiness gate, Trial conversion simulator, upgrade/downgrade quote and simulator seams, cancel/reverse cancel, retry schedule, termination/recovery, export, notification outbox, signup correction auto-reject, deletion dry-run.
- Exclusions: no actual PG provider, no merchant secret, no real card entry, no production charge/refund/webhook, no actual email delivery, no production export/deletion, no Worker change.

## 0.24.31 - Canonical Policy Conformance Remediation and PG-neutral Billing Foundation

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.31.ts`.
- Formal audit: `docs/audits/0.24.31-canonical-policy-conformance-audit.md`.
- Pricing policy is synchronized to final owner policy: Trial 7 days/100MB/3 members/0 KRW; Lite 9,900 KRW/500MB/3 members; Flow 19,900 KRW/1.5GB/10 members; Studio 39,900 KRW/5GB/30 members; Custom negotiated; add-on storage 7,000 KRW per 1GB/month; VAT included.
- PG-neutral payment reference and simulator-safe billing lifecycle foundation are implemented without actual PG, merchant, webhook, charge, refund, or raw card storage.
- Retry, termination/recovery/deletion, company-wide Export, notification outbox, and signup correction deadline foundations are recorded as policy/domain contracts.
- Storage full-block coverage now includes workorder creation and workflow growth transitions in addition to existing upload/PDF guards.
- DB migration execution, production mutation, actual email delivery, Worker source change, and Worker deployment are not part of this version.

## Completed Foundation

### 0.24.26 - Public Signup, Verification, Approval, and Trial

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.26.ts`.
- Signup schema, repository/API/session foundation, Google email_verified handling, pending guard, public signup UI, consent evidence, certificate R2 integration, system-admin review, approval provisioning, Trial 7 days/100MB/3 members, and guarded dev/test approval provisioning integration are complete for the committed foundation scope.

### 0.24.27 - System Catalog, Sizes, and POM

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.27.ts`.
- System catalog schema, apparel defaults, underwear/accessory default-inactive entries, size set, POM foundation, company activation rows, company-admin activation UI/API, signup approval provisioning linkage, and guarded dev/test provisioning integration are complete.
- Existing companies are not automatically changed by migration or background backfill.

### 0.24.28 - PDF and R2 Lifecycle

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.28.ts`.
- Canonical PDF model, field visibility, due-date guard, canonical PDF R2 key, Worker 0.13.71 policy, server proxy inline viewer, lifecycle integration, reconciliation, exact cleanup, and residual DB/R2 0 evidence are complete.

### 0.24.29 - Integrated Productization Checkpoint

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.29.ts`.
- The integrated signup, provisioning, catalog, workorder PDF, and PDF/R2 lifecycle checkpoint is complete.
- Manual QA checklist: `docs/qa/0.24.29-integrated-productization-checkpoint.md`.

### 0.24.30 - Storage Capacity Profiles

- Canonical detail file: `lib/internal/roadmap/roadmap-0.24.30.ts`.
- Trial/Lite/Flow/Studio storage/member limits, storage usage aggregation, capacity profile evidence, upload guard, and generated PDF guard are complete.

## Next Version

### 0.24.34 - Workorder Size Specification and Incomplete/Final PDF

- Read `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md` and `lib/internal/roadmap/roadmap-0.24.34.ts` before implementation.
- Implement workorder size/POM editing, cm/inch and 1/8-inch handling, copy/reproduction snapshots, incomplete PDF, final PDF, size/POM PDF pages, latest-only retention, and failure-safe replacement.
- Keep supplier order-request PDF separate.
- Do not start Company-wide Export, deletion scheduler, actual PG/email, production mutation, or Worker deployment without the later roadmap/approval boundary.
