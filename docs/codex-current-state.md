# Codex Current State - 0.24.31

## Version

- Current version: `0.24.31`.
- Current implementation version: `0.24.31`.
- Branch: `master`.
- Previous completed version: `0.24.30` Storage Capacity Profiles.
- Next official version: `0.24.32` to be confirmed from the canonical roadmap after this checkpoint.

## Policy Authority

- Product policy source order remains: `AGENTS.md`, this file, `docs/project/26-final-policy-decisions-and-master-todo.md`, `docs/project/31-pre-codex-integrated-master-plan.md`, related latest confirmed topic specs, then canonical roadmap.
- Confirmed policy is not re-asked. If implementation conflicts with final owner policy, classify it as an implementation mismatch and align implementation or roadmap to the final policy.
- Final owner policy requires Trial 7 days, Trial storage 100MB, Trial members 3, mandatory payment readiness before Trial approval, no raw card storage, and PG-neutral handling until provider selection.
- Exact PG/provider selection, merchant secrets, production webhook, actual card registration, actual charge/refund, actual email delivery, production export, and production deletion remain deferred or separately approved work.
- System-admin actual/effective session boundaries and runtime-independent internal read screens remain unchanged from 0.24.25.x corrections.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, Purge, and production mutation guards remain unchanged.

## 0.24.31 Scope

0.24.31 is Canonical Policy Conformance Remediation and PG-neutral Billing Foundation. It audits current implementation against final owner policy and adds provider-neutral domain foundations without real PG/email/provider execution.

Implemented foundation:

- Canonical policy conformance audit: `docs/audits/0.24.31-canonical-policy-conformance-audit.md`.
- Pricing policy: Trial 0 KRW, Lite 9,900 KRW, Flow 19,900 KRW, Studio 39,900 KRW, Custom negotiated, additional storage 7,000 KRW per 1GB/month, VAT included.
- Payment method reference policy: provider-neutral reference only, dev/test fake reference blocked in production, raw card data and raw provider payload excluded.
- Trial billing notice foundation: today charge 0, selected paid plan, scheduled billing date/amount, and cancellation policy.
- Subscription lifecycle foundation: upgrade proration, downgrade refund/eligibility, retry schedule Day 0/3/7/14/21/30, termination/recovery/deletion states.
- Company-wide Export foundation: async job policy, exact-key manifest, split ZIP readiness, seven-day download expiry, final termination export readiness, no raw R2 URL exposure.
- Notification outbox foundation: template codes, recipient scope, idempotency key, safe payload policy, actual email delivery false.
- Signup correction deadline foundation: 3-day deadline, auto-reject job identity, safe notification template, scheduler approval boundary.
- Storage 100% full-block coverage expanded to workorder creation and workflow growth transitions while read/delete/export paths remain allowed.

Out of scope for 0.24.31:

- Actual PG provider SDK, merchant key, billing key issuance, webhook, real charge, or real refund.
- Actual email provider integration or external email sending.
- Production company export, production deletion, broad R2 prefix deletion, or real customer data mutation.
- DB migration execution or destructive schema change.
- Worker source change or Worker deployment.

## Verification State

- DB migration this version: none.
- Production DB/R2/Worker mutation: false.
- Actual PG integration: false.
- Actual email delivery: false.
- Worker source/deployment change: none.
- User manual QA: pending after Vercel deployment.

## Current Roadmap

- Canonical current detail: `lib/internal/roadmap/roadmap-0.24.31.ts`.
- Productization roadmap document: `docs/productization-roadmap.md`.
- Runtime roadmap screen: `/roadmap`.

## Next Version

0.24.32 must be read from the next canonical roadmap/user instruction before implementation. Do not infer live PG, production export, production deletion, or email provider work without explicit scope.
