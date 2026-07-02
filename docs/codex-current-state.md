# Codex Current State - 0.24.33.1

## Version

- Current version: `0.24.33.1`.
- Current implementation version: `0.24.33.1`.
- Branch: `master`.
- Previous completed version: `0.24.33` Public Signup End-to-End UX and System-admin Review Operations.
- Current official work: `0.24.33.1` Authenticated Public Signup E2E and Deployed QA Automation.

## Policy Authority

- Product policy source order remains: `AGENTS.md`, this file, `docs/project/26-final-policy-decisions-and-master-todo.md`, `docs/project/31-pre-codex-integrated-master-plan.md`, related latest confirmed topic specs, then canonical roadmap.
- Confirmed policy is not re-asked. If implementation conflicts with final owner policy, classify it as an implementation mismatch and align implementation or roadmap to the final policy.
- Final owner policy requires Trial 7 days, Trial storage 100MB, Trial members 3, mandatory payment readiness before Trial approval, no raw card storage, and PG-neutral handling until provider selection.
- Exact PG/provider selection, merchant secrets, production webhook, actual card registration, actual charge/refund, actual email delivery, production export, and production deletion remain deferred or separately approved work.
- System-admin actual/effective session boundaries and runtime-independent internal read screens remain unchanged from 0.24.25.x corrections.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, Purge, and production mutation guards remain unchanged.

## 0.24.33.1 Scope

0.24.33.1 extends the completed 0.24.33 public signup and approval path with authenticated browser QA automation, dev/test session fixtures, Playwright browser matrix metadata, deployed smoke wiring, and `/functions` automation catalog coverage.

Implemented / in-scope foundation:

- Canonical 0.24.33 public entry, applicant dashboard, system-admin queue/detail, readiness gate, approval, Trial provisioning, and workspace-entry implementation remains intact.
- Dev/test applicant, system-admin, and approved company-admin signed session fixtures are available only in non-production runtime.
- Playwright helper/spec coverage is split from actual Google OAuth and avoids storing or returning raw cookies.
- `/functions` catalog records public signup QA automation status, browser/project coverage, runtime restriction, commands, safety, and remaining manual QA.
- PowerShell menu and `verify-safe` profile connect the authenticated public signup E2E checks.

Out of scope for 0.24.33.1:

- Actual PG provider SDK, merchant key, billing key issuance, webhook, real charge, or real refund.
- Actual email provider integration or external email sending.
- Production company export, production deletion, broad R2 prefix deletion, or real customer data mutation.
- Destructive schema change or production migration.
- Worker source change or Worker deployment.
- 0.24.34 implementation.

## Verification State

- DB migration this version: none; 0.24.33 schema and fixture infrastructure are reused.
- Public signup DB integration from 0.24.33 remains the baseline PASS evidence.
- 0.24.33.1 `public-signup-authenticated-e2e` verification profile: PASS.
- Authenticated public signup Playwright matrix: Chromium desktop/mobile, WebKit desktop/mobile, and iPad WebKit PASS.
- Deployed/read-only signup smoke: PASS for the configured smoke target.
- Signup certificate PNG/JPEG/PDF/revoke integration: PASS with final residual DB rows 0 and residual R2 objects 0.
- Public signup final residual audit: PASS with residual DB rows 0 and residual R2 objects 0.
- Production DB/R2/Worker mutation: false.
- Actual PG integration: false.
- Actual email delivery: false.
- Worker source/deployment change: none.
- User manual QA remains required for actual Google OAuth, real iPhone/iPad Safari OAuth, native file picker, and Vercel session refresh.

## Current Roadmap

- Canonical current detail: `lib/internal/roadmap/roadmap-0.24.33.1.ts`.
- Productization roadmap document: `docs/productization-roadmap.md`.
- Runtime roadmap screen: `/roadmap`.

## Next Version

0.24.34 must be read from the next canonical roadmap/user instruction before implementation. 0.24.33.1 does not start 0.24.34. Do not infer live PG, production export, production deletion, or email provider work without explicit scope.
