# Codex Current State - 0.24.34

## Version

- Current version: `0.24.34`.
- Current implementation version: `0.24.34`.
- Branch: `master`.
- Latest completed version: `0.24.34` Workorder Size Specification and Incomplete/Final PDF.
- Next official work: `0.24.35` Company-wide Export Execution.
- 0.24.35 implementation has not started.

## Mandatory Read Order

Before implementation, Codex must read in this order:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. the latest confirmed topic specs relevant to the target work
6. `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md`
7. `docs/productization-roadmap.md`
8. the target `lib/internal/roadmap/roadmap-*.ts`
9. older/provisional documents

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

- Current completed detail: `lib/internal/roadmap/roadmap-0.24.34.ts`.
- Next planned detail: `0.24.35` Company-wide Export Execution.
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

## Planned Sequence After 0.24.34

1. `0.24.35 — Company-wide Export Execution`
2. `0.24.36 — Termination, Recovery, and Automatic Deletion Execution`
3. `0.24.37 — Operations, Inquiry, Monitoring, CI, Accessibility, Performance, and Backup/Restore Foundations`
4. External-dependency/launch versions for actual PG, email, production infrastructure, DNS/domain, legal review, and consolidated launch QA.
