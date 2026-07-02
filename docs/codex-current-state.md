# Codex Current State - 0.24.33

## Version

- Current version: `0.24.33`.
- Current implementation version: `0.24.33`.
- Branch: `master`.
- Previous completed version: `0.24.32` PG Billing and Subscription Operations.
- Current official work: `0.24.33` Public Signup End-to-End UX and System-admin Review Operations.

## Policy Authority

- Product policy source order remains: `AGENTS.md`, this file, `docs/project/26-final-policy-decisions-and-master-todo.md`, `docs/project/31-pre-codex-integrated-master-plan.md`, related latest confirmed topic specs, then canonical roadmap.
- Confirmed policy is not re-asked. If implementation conflicts with final owner policy, classify it as an implementation mismatch and align implementation or roadmap to the final policy.
- Final owner policy requires Trial 7 days, Trial storage 100MB, Trial members 3, mandatory payment readiness before Trial approval, no raw card storage, and PG-neutral handling until provider selection.
- Exact PG/provider selection, merchant secrets, production webhook, actual card registration, actual charge/refund, actual email delivery, production export, and production deletion remain deferred or separately approved work.
- System-admin actual/effective session boundaries and runtime-independent internal read screens remain unchanged from 0.24.25.x corrections.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, Purge, and production mutation guards remain unchanged.

## 0.24.33 Scope

0.24.33 connects the public signup, applicant dashboard, system-admin signup review, payment-readiness preparation, approval, Trial provisioning, and approved workspace entry into one QA-ready flow.

Implemented / in-scope foundation:

- Canonical public entry: `/signup`.
- Applicant dashboard continues to own draft/submit/correction/resubmit/cancel state.
- System-admin signup queue/detail continue to use actual active system-admin guards.
- Payment readiness must be application-scoped before company creation, then copied into company billing references during approval.
- Dev/test fake readiness is allowed only through guarded system-admin controls; production fake readiness remains blocked.
- Approval UI must surface `SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED` safely and avoid duplicate provisioning.
- Notification outbox links signup review/approval events without actual email delivery.

Out of scope for 0.24.33:

- Actual PG provider SDK, merchant key, billing key issuance, webhook, real charge, or real refund.
- Actual email provider integration or external email sending.
- Production company export, production deletion, broad R2 prefix deletion, or real customer data mutation.
- Destructive schema change or production migration.
- Worker source change or Worker deployment.

## Verification State

- DB migration this version: `db/migrations/patch_0_24_33_public_signup_e2e.sql` applied once to the approved dev/test DB after compatibility audit PASS and followed by post-apply audit PASS.
- Public signup DB integration: PASS with dev/test synthetic fixtures, readiness block, readiness creation, approval, Trial provisioning, duplicate approval, correction/resubmit, reject, provisioning failure compensation, and residual DB/R2 0.
- Certificate integration: PASS for PNG upload, JPEG replacement, PDF replacement, revoke, and residual DB/R2 0 using the existing deployed dev/test Worker policy.
- Browser E2E: PASS for public login/signup CTA route separation using installed local Chrome through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
- Final verification profile: `public-signup-e2e` PASS, including build, mutation audit with 0 high-risk findings, targeted ESLint, typecheck, contracts, Unicode, and PowerShell checks.
- Production DB/R2/Worker mutation: false.
- Actual PG integration: false.
- Actual email delivery: false.
- Worker source/deployment change: none.
- User manual QA: pending after Vercel deployment.

## Current Roadmap

- Canonical current detail: `lib/internal/roadmap/roadmap-0.24.33.ts`.
- Productization roadmap document: `docs/productization-roadmap.md`.
- Runtime roadmap screen: `/roadmap`.

## Next Version

0.24.34 must be read from the next canonical roadmap/user instruction before implementation. Do not infer live PG, production export, production deletion, or email provider work without explicit scope.
