# Codex Operating Rules

## WAFL v2 App-first canonical routing

For every WAFL App-first `2.0.x` task, read these core authorities before modifying files:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/26-final-policy-decisions-and-master-todo.md`
4. `docs/project/31-pre-codex-integrated-master-plan.md`
5. `docs/project/app-v2/00-start-here.md`
6. `docs/project/app-v2/09-codex-working-rules.md`
7. `docs/project/app-v2/08-roadmap-2.0.md`

`docs/project/app-v2/00-start-here.md` owns the conservative task-based additional read set. Read every routed specialist contract and relevant numbered evidence before acting. Do not read every historical evidence file by default, and do not omit cross-domain authorities needed by the task.

Canonical document types are:

- Permanent Rules: `docs/project/app-v2/09-codex-working-rules.md`.
- Current Baseline: `docs/codex-current-state.md`.
- Version Delta and current/next roadmap: `docs/project/app-v2/08-roadmap-2.0.md`.
- Immutable Evidence: numbered `docs/project/app-v2/*-evidence.md` files.

The responsibility matrix and task routing live in `docs/project/app-v2/00-start-here.md`. This file defines repository-level routing and universal safeguards; it does not duplicate App-first Permanent Rules or version histories.

## App-first product boundary

- `docs/project/app-v2/*` is the priority authority for the `2.0.x` App-first line.
- Expo React Native is the customer-facing mobile/tablet priority. Next.js remains for public web, administration, operations, API, documents, internal showroom, and test tooling.
- `docs/project/v2/*` remains the preserved `0.30.x` Product/Sheet/Card and `/ui` design baseline. It is a task-routed reference, not the active App-first delivery ledger.
- Normal production-card phone screens are portrait-first. Tablets support portrait and landscape without becoming compressed desktop administration.
- `/system` and `/workspace` remain until a separately approved phased replacement and removal.
- Do not infer current authority from an old completion paragraph. Use the current snapshot, roadmap Delta, normative specialist owner, and applicable immutable evidence.

## WAFL v2 0.30 redesign routing

For `0.30.x` redesign work, read:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. the task-routed `docs/project/v2/*` product, UI, data, permission, workflow, screen, test, roadmap, PDF/share, and working-rule documents
5. `docs/project/25-korean-unicode-encoding-standard.md`
6. `docs/project/32-product-completion-and-ui-evidence-standard.md`

The `docs/project/v2/*` set is authoritative for the preserved `0.30.x` redesign line. Do not apply old `0.24.x` workorder-centered text when it conflicts with that line's Product/Sheet/Card decisions.

## Canonical policy precedence

When sources conflict, use this order:

1. actual current code, Git, and verified runtime evidence;
2. latest canonical owner document;
3. explicit `CONFIRMED` owner policy;
4. `docs/codex-current-state.md`;
5. current Version Delta and routed specialist contract;
6. immutable evidence for the historical fact it records;
7. older or provisional documents;
8. chat summaries that are not the active owner-approved work order.

Product policy starts with `docs/project/26-final-policy-decisions-and-master-todo.md`, then `docs/project/31-pre-codex-integrated-master-plan.md`, then the related latest confirmed topic specification. A bounded completion proves only its declared scope.

## Start of work

- Check actual KST, repository, branch, HEAD, origin comparison, and full working-tree state before edits.
- Treat the local repository and committed canonical owners as source of truth.
- Do not edit when the user asks for analysis or reporting only.
- Keep changes inside the approved Version Delta and prefer existing shared code and contracts.
- Unexpected dirty state, authority conflict, historical evidence rewrite, or required security relaxation is a stop condition.

## Safety and approval

- Never print or commit env values, credentials, tokens, cookies, private account identifiers, raw connection codes, DB URLs, full fingerprints, private object keys, or temporary external origins.
- Never access or mutate production DB/R2/API bindings without exact approval.
- Never use force push, amend, reset, clean, checkout, rebase, broad process termination, wildcard deletion, or destructive data commands as routine recovery.
- Schema/migration, seed, cleanup, reset, rollback, DB/R2/PDF/token mutation, native/EAS work, dependency changes, and account/credential operations follow the exact boundaries in `09-codex-working-rules.md` and the active Version Delta.
- Stage only explicit paths. Never use `git add .`, `git add -A`, or `git commit -am`.

## Product completion and UI evidence

- Every user-visible task follows `docs/project/32-product-completion-and-ui-evidence-standard.md` plus the App-first device gate in `docs/project/app-v2/05-device-test-plan.md`.
- Code/build/static PASS is not product completion. Required runtime and owner visual judgment must be present before `LEVEL_4_PRODUCT_VERIFIED` or a completed status.
- Reuse canonical WAFL primitives. Do not introduce screen-local duplicate modal, input, button, card, or table grammar when a canonical primitive exists.
- Never recommend Full Reset for a loading/UI failure until API, server, schema, migration, and query evidence proves it necessary and the owner approves it.

## Version and delivery

- `lib/constants/version.ts` owns the app display `APP_VERSION`.
- Root `package.json` is package metadata and changes only under its own approved boundary.
- Ordinary owner-approved version work may proceed continuously through implementation, verification, exact-path stage, one commit, normal `git push origin master`, Finish, and matching artifacts when all safety conditions pass.
- Stop before commit when required validation or user/runtime evidence is absent, an unexpected file changed, a dependency/lockfile or migration appeared outside scope, or any secret/security boundary is uncertain.
- Prefer `tools/pipeline/approved-workflow.ps1 -Action Verify -Profile <profile>`, then Plan/Finish according to the canonical workflow.
- Final delivery requires synchronized `master`, clean Git, one matching Source ZIP and repo-state in `4. Newest`, and no excluded artifact or secret.

## Runtime and internal access

- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by environment strings alone.
- `/id-control` test account switching is allowed for an active system administrator while the action-specific dev/test guard remains authoritative.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- `/roadmap` remains read-only. Tenant, permission, impersonation restore, and audit boundaries remain enforced in UI and server code.
- App-first external QA uses the specialist environment and runtime owners: `06-expo-environment-setup.md` and `41-external-mobile-qa-runbook.md`.

## Korean and Unicode

- Follow `docs/project/25-korean-unicode-encoding-standard.md`.
- Markdown/source uses UTF-8 and repository line-ending policy. Windows PowerShell files keep the required UTF-8 BOM.
- Do not rename Korean paths or rewrite text from a mojibake display alone. Verify Git and original bytes first.

## Reporting

- Lead intermediate and final reports with the actual KST timestamp required by the active Version Delta.
- Separate verified facts from inference and from `NOT_RUN`.
- A failure handoff preserves Git state, logs, runtime ownership, mutation effects, and the smallest next action. It does not claim success, retry automatically, roll back, clean, or delete evidence.
