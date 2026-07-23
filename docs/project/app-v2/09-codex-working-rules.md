# WAFL v2 App-first Permanent Rules Entry Point

Document type: **Permanent Rules**

Canonical owner: `docs/project/app-v2/09-codex-working-rules.md`

This document is the mandatory entry point for durable WAFL App-first `2.0.x` execution rules. It owns precedence, read order, task classification, and routing. Detailed rules have one owner in the linked `09a` through `09d` documents; future Version Deltas use the concise template in `09e`.

## 1. Standard reference and durable application

Every Version Delta uses this line instead of copying the shared rules:

> 실행·보안·Git·Runtime·artifact·실패 정책은 `docs/project/app-v2/09-codex-working-rules.md`를 전부 따른다.

These rules apply to every WAFL Codex task until the owner explicitly changes them. A Delta may strengthen or narrow a rule for its bounded scope. It cannot silently weaken a Permanent Rule, confirmed policy, tenant boundary, production guard, or required stop condition.

An owner-attached or owner-pasted file labeled `SELF-EXECUTING HANDOFF` is execution approval for its stated scope. Codex starts at preflight immediately and does not wait for a second explanation, copy/paste, or confirmation. A discovered stop condition produces the canonical Failure Handoff instead of speculative continuation.

## 2. Authority and required read order

Use the precedence in `AGENTS.md`. Before modifying an App-first task, read:

1. `AGENTS.md`;
2. `docs/codex-current-state.md`;
3. `docs/project/26-final-policy-decisions-and-master-todo.md`;
4. `docs/project/31-pre-codex-integrated-master-plan.md`;
5. `docs/project/app-v2/00-start-here.md`;
6. this entry point;
7. `09a-codex-execution-lifecycle.md`;
8. `09b-codex-runtime-data-pc-safety.md`;
9. `09c-codex-testing-contracts-handoff.md`;
10. `09d-codex-version-delta-finalization.md`;
11. `08-roadmap-2.0.md`;
12. the active owner-approved Version Delta, routed specialist owners, and relevant numbered evidence.

Read `09e-codex-version-delta-template.md` when authoring or reviewing a Version Delta. Task routing adds authorities; it never replaces the core set.

When current code or verified Runtime evidence conflicts with a document, preserve the state and follow the precedence in `AGENTS.md`. When two rules still conflict, apply the more conservative safe rule and stop if the intended scope or authority is not unambiguous. Never rewrite immutable evidence to resolve a current conflict.

## 3. Permanent Rules responsibility map

| Owner | Responsibility |
| --- | --- |
| [09a — Execution Lifecycle](09a-codex-execution-lifecycle.md) | preflight, audit, implementation, static gates, Runtime decision, QA sequence, stop, final evidence, completion |
| [09b — Runtime, Data and PC Safety](09b-codex-runtime-data-pc-safety.md) | canonical runner, ownership, transport, mutation budgets, PC audit, remote-operation safety |
| [09c — Testing, Contracts and Failure Handoff](09c-codex-testing-contracts-handoff.md) | behavior contracts, historical/current assertions, alias boundaries, failure preservation and handoff fields |
| [09d — Version Delta and Finalization](09d-codex-version-delta-finalization.md) | Delta authority, Git, commit/push, documentation maintenance, ZIP/repo-state, clean delivery |
| [09e — Self-Executing Version Delta Template](09e-codex-version-delta-template.md) | concise file-only handoff format used by alpha.55 and later |

Specialist environment and command details remain in `06-expo-environment-setup.md` and `41-external-mobile-qa-runbook.md`. Verification semantics remain in `17-v2-api-contract-test-plan.md`. Device judgment remains in `05-device-test-plan.md` and `docs/project/32-product-completion-and-ui-evidence-standard.md`.

## 4. Task classification

Classify the task before acting:

- **Analysis/report only:** read-only evidence inspection; no edits, Runtime mutation, Git delivery, or external write.
- **Documentation/static maintenance:** docs and approved validation infrastructure only; Runtime is `NOT_REQUIRED` unless the Delta says otherwise.
- **Product implementation:** scoped source plus targeted/static validation; Runtime and device gates are determined by visible or behavioral impact.
- **Runtime read-only QA:** canonical runner and exact ownership with mutation budget `0`.
- **Bounded dev/test mutation:** only the exact target, command, effect, and evidence budget named in the Delta.
- **Production, schema, native/EAS, dependency, credential, or destructive work:** separate exact authority is mandatory.

Implement only the active scope. Prefer the smallest reversible change and existing shared primitives, services, and contracts. Analysis-only requests authorize no edits. A previous version's mutation, deployment, native, or account authority never carries forward.

## 5. Durable security and approval boundary

Never expose credentials, tokens, cookies, connection codes, auth material, DB URLs, private keys, full private identifiers, complete WorkOrder UUIDs, full fingerprints, temporary external origins, signed URLs, object keys, or raw customer content in source, tracked docs, logs, artifacts, repo-state, screenshots, or chat. Use sanitized counts, booleans, aliases, host type, and approved short hash prefixes.

Tenant/company scope is server-derived and permission is enforced server-side. UI affordances are not authorization. Production access and mutation are never implied by dev/test, Tailscale identity, or a product Version Delta.

Separate exact approval is always required for:

- production deploy, access, or mutation;
- credentials, certificates, accounts, teams, devices, or signing changes;
- EAS Build or EAS Update;
- native dependency/plugin, Info.plist, AndroidManifest, bundle/package/signing identity changes;
- dependency or root lockfile changes not named by the Delta;
- force push, amend, history rewrite, reset, checkout, restore, rebase, merge, or branch deletion;
- broad process kill, wildcard cleanup/delete, purge, or any operation whose exact target cannot be stated.

Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`. `/id-control` test account switching is allowed while its session, impersonation restore, and audit contracts pass. Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged. The canonical profile for this boundary is `system-admin-internal-access`.

## 6. Compatibility index for historical contracts

Historical contracts may verify these durable semantic names. Their detailed owners are the linked documents, not this index:

- Actual KST reporting and Start-of-work baseline: `09a`.
- Mandatory PC Resource and Remote-Operation Audit, Runtime transport, Process ownership and stop safety, and Funnel semantic status: `09b`.
- Security and sensitive information and Tenant, company, permission, and production boundaries: this entry point and `09b`.
- Standing authorization for an exact Version Delta: `09d`.
- Retry, correction, and failure preservation: `09c`.
- User and device QA: `09a`.
- Native and EAS: this entry point and `09d`.
- Verification: `09a`, `09c`, and `17-v2-api-contract-test-plan.md`.
- Source ZIP, repo-state, and `4. Newest`: `09d`.
- Version Delta contract: `09d` and `09e`.

The PC audit checkpoints remain: start-of-work preflight, immediately before Runtime start, after automated Runtime QA, immediately before requesting physical-device QA, and after runner stop and before final verification. Static-only work uses start and pre-final verification. If sensors are not reliably readable, record exactly `Temperature: unavailable with approved read-only tooling`. A clear risk uses `PC_RESOURCE_OR_REMOTE_OPERATION_RISK_HANDOFF_REQUIRED`.

A concise Version Delta names model, reasoning, and speed; baseline version and HEAD; result version; target status; objective; included scope; non-goals; allowed mutation/effect budget; boundaries; required Runtime and QA; required contracts and verification; completion gates; candidate commit message; and next-version boundary.

## 7. Omitted authority and completion

Omitted production, mutation, schema, dependency, native/EAS, destructive, credential, external-account, or artifact authority remains forbidden. A status is complete only when every applicable gate in the Delta and the linked Permanent Rules passes. Anything not executed is `NOT_RUN`, never inferred PASS.
