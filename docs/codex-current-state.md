# Codex Current State - 0.24.32

## Version

- Current version: `0.24.32`.
- Current implementation version: `0.24.32`.
- Branch: `master`.
- Previous completed version: `0.24.31` Canonical Policy Conformance Remediation and PG-neutral Billing Foundation.
- Next official version: `0.24.33` to be confirmed from the canonical roadmap after this checkpoint.

## Policy Authority

- Product policy source order remains: `AGENTS.md`, this file, `docs/project/26-final-policy-decisions-and-master-todo.md`, `docs/project/31-pre-codex-integrated-master-plan.md`, related latest confirmed topic specs, then canonical roadmap.
- Confirmed policy is not re-asked. If implementation conflicts with final owner policy, classify it as an implementation mismatch and align implementation or roadmap to the final policy.
- Final owner policy requires Trial 7 days, Trial storage 100MB, Trial members 3, mandatory payment readiness before Trial approval, no raw card storage, and PG-neutral handling until provider selection.
- Exact PG/provider selection, merchant secrets, production webhook, actual card registration, actual charge/refund, actual email delivery, production export, and production deletion remain deferred or separately approved work.
- System-admin actual/effective session boundaries and runtime-independent internal read screens remain unchanged from 0.24.25.x corrections.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, Purge, and production mutation guards remain unchanged.

## 0.24.32 Scope

0.24.32 is PG Billing and Subscription Operations. It connects the 0.24.31 provider-neutral billing foundation to additive persistence, guarded services, APIs, migration/audit wrappers, and simulator-safe operation paths without real PG/email/provider execution.

Implemented foundation:

- Canonical policy conformance audit remains: `docs/audits/0.24.31-canonical-policy-conformance-audit.md`.
- Additive migration file: `db/migrations/patch_0_24_32_billing_operations.sql`.
- Payment readiness persistence: `company_payment_method_references` stores provider-neutral references only; production fake readiness is blocked.
- Signup approval gate: approval/provisioning checks persisted payment readiness server-side before Trial starts.
- Billing lifecycle persistence: `billing_subscription_states` carries canonical lifecycle states without replacing the legacy `company_subscriptions` snapshot.
- Invoice/payment/refund/retry/event persistence: integer KRW, VAT-included, idempotency keys, safe failure codes, and no raw provider payload.
- Company export, termination/recovery, notification outbox, and correction auto-reject have persistence and simulator-safe operation seams.
- Company-admin/system-admin billing operation APIs are guarded by tenant/system scope and same-origin checks.

Out of scope for 0.24.32:

- Actual PG provider SDK, merchant key, billing key issuance, webhook, real charge, or real refund.
- Actual email provider integration or external email sending.
- Production company export, production deletion, broad R2 prefix deletion, or real customer data mutation.
- Destructive schema change or production migration.
- Worker source change or Worker deployment.

## Verification State

- DB migration this version: additive file added; dev/test apply requires approved fingerprint guard.
- Production DB/R2/Worker mutation: false.
- Actual PG integration: false.
- Actual email delivery: false.
- Worker source/deployment change: none.
- User manual QA: pending after Vercel deployment.

## Current Roadmap

- Canonical current detail: `lib/internal/roadmap/roadmap-0.24.32.ts`.
- Productization roadmap document: `docs/productization-roadmap.md`.
- Runtime roadmap screen: `/roadmap`.

## Next Version

0.24.33 must be read from the next canonical roadmap/user instruction before implementation. Do not infer live PG, production export, production deletion, or email provider work without explicit scope.
