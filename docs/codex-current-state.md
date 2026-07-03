# Codex Current State - 0.24.34.3.1

## Version

- Current version: `0.24.34.3.1`.
- Current implementation version: `0.24.34.3.1`.
- Branch: `master`.
- Latest completed version: `0.24.34.3.1` Product Completion, Canonical WAFL UI, and Automated Evidence Standard.
- Next mandatory work: `0.24.34.4` Workorder Runtime Recovery, Right-side Size Panel, WAFL Modal, and Signup Submission E2E.
- Next official feature after that: `0.24.35` Company-wide Export Execution.
- 0.24.34.4 and 0.24.35 implementation have not started.

## Mandatory Read Order

Before implementation, Codex must read in this order:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. the latest confirmed topic specs relevant to the target work
6. `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md`
7. `docs/productization-roadmap.md`
8. `docs/project/32-product-completion-and-ui-evidence-standard.md` for every user-visible UI task
9. the target `lib/internal/roadmap/roadmap-*.ts`
10. older/provisional documents

Rules:

- CONFIRMED policy is not re-asked.
- If implementation, an older roadmap, or general SaaS convention conflicts with final owner policy, classify it as an implementation mismatch.
- The latest implementation audit is evidence of actual completion state, not a replacement for final owner policy.
- A historical roadmap entry marked `completed` means that entry's declared scope was completed. It does not prove that every higher-level canonical product requirement in the same domain is finished.

## Policy Authority

- Trial remains 7 days, 100MB, and 3 members.
- Payment readiness remains mandatory before Trial approval.
- Raw card data must never be stored.
- Actual PG/provider selection, merchant secrets, production webhook, real charge/refund, and actual email delivery remain deferred or separately approved.
- System-admin actual/effective session boundaries and runtime-independent internal read screens remain unchanged.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, Purge, and production mutation guards remain unchanged.

## Latest Completed State

0.24.33 and 0.24.33.1 completed the public signup and approval path plus authenticated browser QA automation:

- `/signup` public Trial entry and login CTA separation.
- Applicant application form and system-admin review queue/detail.
- Dev/test payment-readiness preparation and approval guard.
- Trial/company/admin/catalog/quota provisioning integration.
- Authenticated applicant, system-admin, and approved company-admin fixtures in non-production runtime.
- Chromium/WebKit/mobile/iPad browser matrix and deployed read-only smoke.
- Certificate PNG/JPEG/PDF/revoke integration with residual DB/R2 0.

Remaining manual QA:

- Actual Google OAuth round trip.
- Actual iPhone/iPad Safari OAuth and native file picker.
- Actual Vercel session refresh and real-device safe-area/keyboard behavior.

These manual checks do not block 0.24.34 implementation, but they remain `PENDING_USER_QA` and must be revisited before launch or after signup/auth changes.

## Foundation vs Product Completion Reconciliation

The 0.24.33.1 full audit found that several historical sprints completed their bounded foundation scope but not the complete customer-facing product path.

Completed foundations:

- 0.24.27: system catalog, size-set, POM definitions, activation, and provisioning foundation.
- 0.24.28: supplier order-request PDF and private R2 lifecycle/reconciliation foundation.
- 0.24.31~0.24.32: PG-neutral billing policy, persistence, simulator, export/termination/notification foundation.
- 0.24.30: storage capacity profiles and principal quota guards.

0.24.34 completed product paths:

- Workorder size-set/POM selection from active defaults.
- Size-by-POM measurement editing and persistence with cm/inch and 1/8-inch validation.
- Incomplete workorder PDF and final workorder PDF as distinct generated document types.
- Incomplete watermark, status badge, missing-item list, final eligibility, size/POM pages, latest-only retention, failure-safe replacement, private R2 lifecycle, quota accounting, and inline viewer.

Still open product paths:

- Full copy/reproduction UI proof for size/POM snapshots beyond repository/schema contracts.
- Rendered PDF visual QA on real devices remains `PENDING_USER_QA`.
- First-failure operator notification is recorded as foundation/backlog unless the actual notification provider is separately approved.
- Actual Company-wide Export ZIP execution, expiry, split parts, cleanup, plan enforcement, and final termination Export.
- Durable termination/recovery/deletion scheduler and exact execution.
- Actual PG/email/provider/production launch integrations.
- Inquiry, monitoring, CI, accessibility, performance, backup/restore, and launch QA.

Canonical evidence:

- `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md`

## Current Roadmap

- Current completed detail: `lib/internal/roadmap/roadmap-0.24.34.3.1.ts`.
- Next mandatory detail: `0.24.34.4` Workorder Runtime Recovery, Right-side Size Panel, WAFL Modal, and Signup Submission E2E.
- Next planned feature after the mandatory patch: `0.24.35` Company-wide Export Execution.
- Productization roadmap: `docs/productization-roadmap.md`.
- Runtime roadmap screen: `/roadmap`.

## 0.24.34 Completed Scope

`0.24.34 — Workorder Size Specification and Incomplete/Final PDF`

Implemented scope:

- Workorder size-set selection and POM rows from active defaults.
- Size-by-POM editing and persistence.
- cm/inch support and deterministic 1/8-inch handling.
- Company defaults/workorder overrides where current policy allows.
- Size/POM snapshot schema and repository support for copy/reproduction preservation.
- Incomplete workorder PDF with watermark, status badge, and missing-item list.
- Final workorder PDF with canonical eligibility and size/POM pages.
- Explicit separation from supplier order-request PDF.
- Latest-only final PDF retention, failure-safe replacement, private R2 lifecycle, quota accounting, and exact cleanup hooks.
- Responsive workorder editing surface for desktop/tablet/mobile.

Out of scope:

- Company-wide Export execution (`0.24.35`).
- Termination/recovery/automatic deletion execution (`0.24.36`).
- Operations/inquiry/monitoring/CI/accessibility/performance (`0.24.37`).
- Actual PG/email/provider/production work unless separately approved.

## 0.24.34.1 Patch Scope

`0.24.34.1 — Public Signup First-Draft Flow Fix and Repo-state Metadata Correction`

Implemented scope:

- Google OAuth-success applicant sessions with no signup application row are treated as a normal first-draft state.
- `/api/signup/application/certificate` GET returns `{ ok: true, certificate: null }` when the applicant has no application yet.
- Signup dashboard separates applicant/application loading from consent and certificate loading failures.
- Certificate upload remains blocked until the first draft application is saved.
- First-draft users see the company information form and do not loop back to the Google signup CTA.
- Repo-state metadata publication is corrected so the 0.24.34 workorder-size-pdf migration/audit evidence is explicit.

Out of scope:

- 0.24.35 Company-wide Export execution.
- Worker changes or deployment.
- Actual PG/email.
- Production mutation.
- New DB migration.

## 0.24.34.2 Patch Scope

`0.24.34.2 - Customer-facing Product UX, System Catalog, Size Editing, and Workorder PDF Integration Cleanup`

Implemented scope:

- Public signup copy was simplified for customers and no longer presents implementation terms as user-facing guidance.
- Signup uses plan cards, terms/privacy viewers, automatic draft creation on certificate file selection, and a single `가입 신청 제출` action.
- Customer company file copy avoids R2/DB/API implementation wording in customer-facing fallback states.
- System catalog is presented as `기준관리 - 생산품 분류·사이즈·치수`, with product categories, size sets, POMs, and default measurement chart discovery in one entry.
- Workorder size/POM details are summarized in the side panel and edited in a modal.
- Inch input is split into whole-number and 1/8-fraction controls.
- Workorder PDF output is a single action; the server automatically chooses incomplete or final based on completeness.
- Generated workorder PDF filenames use safe Korean status labels.
- Missing PDF object viewer fallback is a customer-safe HTML state instead of a raw JSON error page.

Out of scope:

- 0.24.35 Company-wide Export execution.
- New DB migration, production migration, or production data mutation.
- Worker source changes or deployment.
- Actual PG/email provider integration.
- Broad public marketing site redesign or `/workers` redesign.

## 0.24.34.3 Patch Scope

`0.24.34.3 - Workorder PDF Live R2 Integration and Visual Verification`

Implemented scope:

- Generated workorder PDF completion requires non-empty PDF binary and R2 read-back verification before attachment metadata registration.
- Workorder PDF response links use the tenant-scoped workorder generated-PDF viewer route instead of a generic raw-key file proxy.
- The workorder PDF viewer supports inline view and server-proxied download disposition without exposing a signed URL or raw R2 URL.
- PDF/R2 lifecycle integration now records incomplete workorder PDF, final workorder PDF, order-request PDF type isolation, previous-final preservation, exact cleanup, and residual DB/R2 evidence.
- R2 Upload Worker remains `0.13.71`; PDF Generator Worker remains `0.16.1.1`.

Out of scope:

- 0.24.35 Company-wide Export execution.
- New DB migration, production migration, or production data mutation.
- Worker source changes or deployment.
- Actual PG/email provider integration.

## Planned Sequence After 0.24.34.3.1

1. `0.24.34.4 — Workorder Runtime Recovery, Right-side Size Panel, WAFL Modal, and Signup Submission E2E`
2. `0.24.35 — Company-wide Export Execution`
3. `0.24.36 — Termination, Recovery, and Automatic Deletion Execution`
4. `0.24.37 — Operations, Inquiry, Monitoring, CI, Accessibility, Performance, and Backup/Restore Foundations`
5. External-dependency/launch versions for actual PG, email, production infrastructure, DNS/domain, legal review, and consolidated launch QA.


## 0.24.34.3.1 Product Completion Standard

`0.24.34.3.1 — Product Completion, Canonical WAFL UI, and Automated Evidence Standard`

Confirmed rules:

- UI work is complete only at `LEVEL_4_PRODUCT_VERIFIED`.
- Code existence, build, typecheck, lint, and static contracts alone are not product completion.
- Exact host component, section order, forbidden duplicate locations, and canonical WAFL imports must be stated and verified.
- Localhost Playwright evidence is mandatory: desktop/mobile screenshots, iPad when relevant, interaction screenshot, locator assertions, console error 0, unexpected failed request 0, and trace/network diagnostics for failures.
- Credentials remain in gitignored local environment or storageState inputs and never enter Git or handoff ZIPs.
- Full Reset is prohibited as a generic fix; API, loading-state, migration, schema, and query evidence plus user approval are required.
- Canonical detail: `docs/project/32-product-completion-and-ui-evidence-standard.md`.

## 0.24.34.4 Mandatory Next Scope

Before 0.24.35, Codex must complete:

- workorder list/detail indefinite-loading diagnosis and runtime repair without assuming Full Reset,
- size summary in the canonical right-side panel after 디자인, 첨부 파일, 공장 전달사항, with the center duplicate removed,
- replacement of the screen-local size dialog overlay with canonical WAFL modal and controls,
- real dev/test signup submit → system-admin queue → approval → Trial → workspace E2E,
- customer-copy audit in running localhost screens,
- automated desktop/mobile/iPad screenshots, locator assertions, console/network evidence, and traces,
- requirement matrix with every mandatory item at `LEVEL_4_PRODUCT_VERIFIED`.

0.24.35 must not start before this mandatory patch is product-verified.
