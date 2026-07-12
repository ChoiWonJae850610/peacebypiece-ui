# Codex Operating Rules

## WAFL v2 App-first 2.0 Read Order
- For WAFL v2 App-first / `2.0.x` work, Codex must read this order before any file modification:
  1. `AGENTS.md`
  2. `docs/codex-current-state.md`
  3. `docs/project/app-v2/00-start-here.md`
  4. `docs/project/app-v2/01-app-first-product-definition.md`
  5. `docs/project/app-v2/02-mobile-tablet-ux-principles.md`
  6. `docs/project/app-v2/03-app-architecture.md`
  7. `docs/project/app-v2/04-auth-google-apple.md`
  8. `docs/project/app-v2/05-device-test-plan.md`
  9. `docs/project/app-v2/06-expo-environment-setup.md`
  10. `docs/project/app-v2/07-feature-map-from-ui-alpha27.md`
  11. `docs/project/app-v2/08-roadmap-2.0.md`
  12. `docs/project/app-v2/09-codex-working-rules.md`
  13. `docs/project/app-v2/10-public-landing-site.md`
  14. `docs/project/app-v2/11-app-design-theme-v1.md`
  15. `docs/project/app-v2/12-v1-db-api-performance-audit.md`
  16. `docs/project/app-v2/13-core-domain-schema-v2.md`
  17. `docs/project/app-v2/14-v2-schema-migration-and-performance-plan.md`
  18. `docs/project/app-v2/15-v2-source-db-boundary-and-release-policy.md`
  19. `docs/project/app-v2/16-workorder-api-command-read-model-contracts.md`
  20. `docs/project/app-v2/17-v2-api-contract-test-plan.md`
  21. `docs/project/app-v2/18-v2-additive-migration-draft-and-schema-contract.md`
  22. `docs/project/app-v2/19-v2-dev-test-migration-and-performance-evidence.md`
  23. `docs/project/app-v2/20-workorder-list-read-api-evidence.md`
  24. `docs/project/app-v2/21-workorder-detail-lazy-read-api-evidence.md`
  25. `docs/project/app-v2/22-workorder-create-basic-update-command-evidence.md`
  26. `docs/project/app-v2/23-workorder-material-order-command-evidence.md`
  27. `docs/project/app-v2/24-workorder-revision-issue-command-evidence.md`
  28. `docs/project/app-v2/25-workorder-issued-revision-preview-evidence.md`
  29. `docs/project/app-v2/26-mobile-issued-preview-entry-evidence.md`
  30. `docs/project/app-v2/27-factory-workorder-input-and-preview-evidence.md`
  31. `docs/project/v2/00-start-here.md` through `docs/project/v2/14-operational-policy-absorption.md`
  32. `docs/project/25-korean-unicode-encoding-standard.md`
  33. `docs/project/32-product-completion-and-ui-evidence-standard.md`
  34. `docs/project/26-final-policy-decisions-and-master-todo.md`
  35. `docs/project/31-pre-codex-integrated-master-plan.md`
- `docs/project/app-v2/*` is the priority authority for the `2.0.x` App-first line.
- Existing `docs/project/v2/*` documents are not deleted. They remain the `0.30.x` `/ui` design baseline and preserved policy reference for Product, Sheet/Card, Korean role labels, Neon/R2/Worker, PDF/share, mobile-web, and QA rules.
- `www.wafl.co.kr` is the public marketing, download, pricing, examples, inquiry, trial-request, and waitlist landing site for the WAFL app.
- `/ui`, `/roadmap`, and `/functions` are localhost-only development check routes for `2.0.x`. They must not be exposed on production domains, Vercel preview hosts, or `www.wafl.co.kr`.
- `/system` and `/workspace` are long-term removal targets in the App-first product direction, but do not delete them until a separate phased deprecation, guard/hidden, and removal work order replaces their remaining duties.
- `/ui` remains an implementation-baseline design showroom. It is not the customer-facing app target.
- The customer-facing UI direction is Expo React Native first.
- `docs/project/app-v2/11-app-design-theme-v1.md` defines the first app visual foundation: `동대문 제작 워크룸 / Dongdaemun Atelier Ops`.
- `docs/project/app-v2/12-v1-db-api-performance-audit.md`, `13-core-domain-schema-v2.md`, and `14-v2-schema-migration-and-performance-plan.md` define the read-only v1 evidence, v2 core schema target, and migration/performance gates. They do not authorize migration execution.
- `docs/project/app-v2/15-v2-source-db-boundary-and-release-policy.md`, `16-workorder-api-command-read-model-contracts.md`, and `17-v2-api-contract-test-plan.md` define the source/DB workspace boundary, type-only WorkOrder contracts, and alpha.21~22 gates. `db/v2` contains no executable SQL in alpha.20.
- `docs/project/app-v2/18-v2-additive-migration-draft-and-schema-contract.md` and `db/v2/migrations/001` through `006` define the alpha.21 additive SQL draft and static schema contract. They do not authorize SQL execution; apply, constraint validation, seed, RLS runtime proof, and benchmarks remain alpha.22 dev/test-only work requiring separate approval.
- `docs/project/app-v2/19-v2-dev-test-migration-and-performance-evidence.md` records the explicitly approved alpha.22 dev/test apply, deterministic 500/5,000/multi-tenant seed, RLS/cursor/concurrency evidence, and measured budgets. It does not authorize production apply, cleanup, Full Reset, constraint validation, API writes, or future DB mutation.
- `docs/project/app-v2/20-workorder-list-read-api-evidence.md` defines the alpha.23 dev/test-only `GET /api/v2/work-orders` vertical slice. It authorizes no write command, production DB access, mobile API connection, detailed/tab API, migration, seed, cleanup, R2, Worker, or PDF mutation.
- `docs/project/app-v2/21-workorder-detail-lazy-read-api-evidence.md` defines the alpha.24 dev/test-only core detail and tab-specific lazy Read API slice. It authorizes no command, mobile API connection, migration, seed, schema validation, R2/Worker/PDF integration, or production access.
- `docs/project/app-v2/22-workorder-create-basic-update-command-evidence.md` defines the alpha.25 draft WorkOrder create/basic-update Command boundary. Source and read-only preflight do not authorize valid POST/PATCH mutation; the bounded synthetic dev/test Command runtime requires a separate explicit owner approval.
- `docs/project/app-v2/23-workorder-material-order-command-evidence.md` defines the completed alpha.26 fabric/accessory create, patch, order-request, cancel, and complete boundary, including its approved bounded synthetic mutation, `NO_PARTIAL_MUTATION` audit, preserved runner failures, and final GET-only completion evidence. It authorizes no further mutation replay, cleanup, production access, or mobile API connection.
- `docs/project/app-v2/24-workorder-revision-issue-command-evidence.md` records the completed alpha.27 current-revision issue, document-number allocation, immutable finalization, idempotency/concurrency runtime, bounded completion, and material-order shared lock/rollback contract. It authorizes no replay, correction/reissue, production access, R2/Worker/PDF integration, or further synthetic mutation.
- Normal mobile production-card screens are portrait-first. Mobile landscape is not the default production-card target; the future sketch/drawing module may be the mobile-landscape exception.
- Tablet app screens must support portrait and landscape without becoming a compressed desktop admin layout.
- Next.js remains for system admin, customer admin advanced settings, operations, API, document, internal showroom, and test-console flows.
- For `2.0.x` work, do not implement from old `0.24.x` workorder-centric documents when they conflict with the App-first product direction or the active `app-v2` documents.

## WAFL v2 0.30 Redesign Read Order
- For WAFL v2 / `0.30.x` redesign work, Codex must read this order before any file modification:
  1. `AGENTS.md`
  2. `docs/codex-current-state.md`
  3. `docs/project/v2/00-start-here.md`
  4. `docs/project/v2/01-product-definition.md`
  5. `docs/project/v2/02-ui-philosophy.md`
  6. `docs/project/v2/03-data-model.md`
  7. `docs/project/v2/04-permission-action-codes.md`
  8. `docs/project/v2/05-status-workflow.md`
  9. `docs/project/v2/06-screen-spec.md`
  10. `docs/project/v2/07-design-system.md`
  11. `docs/project/v2/08-feature-spec.md`
  12. `docs/project/v2/09-test-plan.md`
  13. `docs/project/v2/10-roadmap-0.30.md`
  14. `docs/project/v2/11-pdf-share-spec.md`
  15. `docs/project/v2/12-codex-working-rules.md`
  16. `docs/project/25-korean-unicode-encoding-standard.md`
  17. `docs/project/32-product-completion-and-ui-evidence-standard.md`
- For v2 work, `docs/project/v2/*` is the active product/design/spec authority. Pre-v2 `docs/project/*` documents remain historical references unless `docs/project/v2/12-codex-working-rules.md` explicitly classifies them as keep/reference/archive.
- Do not implement from old `0.24.x` workorder-centric documents when they conflict with v2 Product/Style, WAFL Sheet, Sheet Card, Korean role label, Neon/R2/Worker, or mobile-web interaction decisions.


## Canonical Project Context
- For productization/version work, read these files before implementation: `docs/codex-current-state.md`, `docs/project/01-codex-context.md`, `docs/project/02-project-decisions.md`, `docs/project/03-productization.md`, `docs/project/04-release-checklist.md`, `docs/productization-backlog.md`, and the target `lib/internal/roadmap/roadmap-*.ts`.
- `AGENTS.md` defines operating rules. `docs/project/*` records the project context, durable decisions, productization process, and release checklist. Do not duplicate large policy blocks in both places.
- For product policy, billing, signup, trial, access-boundary, and launch decisions, prefer the final owner policy documents first: `docs/codex-current-state.md`, then `docs/project/26-final-policy-decisions-and-master-todo.md`, then `docs/project/31-pre-codex-integrated-master-plan.md`, then related latest confirmed topic specs, then `lib/internal/roadmap/*`, then older/provisional documents.
- For next-version scope and actual completion state, read the latest relevant implementation audit after final owner policy and topic specs; current audit: `docs/audits/0.24.33.1-unimplemented-feature-full-audit.md`. Audits provide implementation evidence and do not override final owner policy.
- A roadmap item marked completed proves only that item's declared scope. Do not infer that all higher-level canonical product requirements in the same domain are finished when the item explicitly delivered foundation or deferred execution.
- If existing implementation, older roadmap text, or general security defaults conflict with final owner policy, classify it as an implementation mismatch and align the roadmap/implementation to the final policy instead of re-asking settled decisions.



## Product Completion And UI Evidence
- For every user-visible UI task, read and follow `docs/project/32-product-completion-and-ui-evidence-standard.md`.
- UI work is complete only at `LEVEL_4_PRODUCT_VERIFIED`: the running localhost product matches the requested location, wording, visual system, responsive behavior, and interaction flow, with required screenshot/locator/console/network evidence.
- Code existence, passing build, or static contracts alone must be reported as `CODE_COMPLETE` or `STATIC_VERIFIED`, not `completed`.
- Use the exact canonical WAFL components listed in the standard. A screen-local `fixed inset-0` dialog overlay, custom focus/scroll-lock modal, or duplicated button/input/table visual grammar is a failure when a canonical WAFL component exists.
- Express layout requirements as exact host component, section order, and forbidden duplicate locations, then verify them with Playwright locators.
- UI versions require localhost Playwright evidence: desktop/mobile screenshots, iPad when relevant, interaction screenshots, console error 0, unexpected failed request 0, and trace/network diagnostics for failures. Missing evidence means `PRODUCT_QA_INCOMPLETE`.
- Credentials and Google account passwords must remain in gitignored local environment/storageState inputs and must never enter Git, logs, screenshots, traces, or handoff ZIPs.
- Do not recommend Full Reset for loading/UI failures until API, server, loading-state, migration, schema, and query evidence proves it is required. Full Reset remains destructive and requires explicit user approval.

## Start Of Work
- Before changing files, check `git status`, the current branch, and `HEAD`.
- Do not edit files when the user asks for analysis, inspection, or reporting only.
- Keep changes inside the requested scope. Do not refactor adjacent code unless it is required for the task.
- Prefer existing shared components, constants, utilities, services, and repositories before adding new code.
- Treat the local repository, committed docs, and current Git state as the source of truth. Do not rely on previous chat memory when recovering project state.

## Autonomy And Questions
- When the user gives a clear goal and scope, proceed within the safest reversible path instead of stopping to ask broad 1/2/3 option questions.
- Codex should decide routine implementation details such as helper names, file organization, wording, test order, and minor refactors by following the existing project pattern, minimum change, shared components/utilities, low risk, and maintainability.
- If several safe implementations are equivalent for product behavior, choose the recommended one and explain the reason in the result report.
- Stop for user confirmation only when the action needs explicit approval, can affect production data or secrets, changes dependencies/package metadata, moves/deletes/renames files beyond the safe scoped cleanup rules below, changes schema or product policy, or is hard to reverse.
- If the user explicitly asks for analysis, inspection, review, or reporting only, stop after that and do not modify files.
- Unless the user asked for analysis only, continue from analysis to scoped edits and safe verification when the request clearly implies a fix.
- For ordinary version work with a clear user-provided goal and scope, follow the automatic version workflow below instead of stopping before every Git index/history/remote step.

## Default Automatic Version Workflow
- When the user clearly specifies a version goal and scope, treat analysis, implementation, validation, staging, commit, push, and final reporting as one continuous task.
- The normal flow is: check branch/HEAD/origin/working tree, read the canonical roadmap detail for the target version, inspect relevant code and docs, implement within scope, update `APP_VERSION` and versioned docs when the task is a versioned patch, update the roadmap result with actual implementation/verification/commit/remaining issues, run `tools/pipeline/approved-workflow.ps1 -Action Verify` when its profile covers the scope, review the final diff, use `tools/pipeline/approved-workflow.ps1 -Action Plan`, finish Git with `tools/pipeline/approved-workflow.ps1 -Action Finish`, verify origin is synchronized and the working tree is clean, verify `4. Newest` handoff artifacts, then report the result.
- Do not ask for separate user approval before stage, commit, or `git push origin master` during ordinary version work when all automatic Git conditions below are satisfied.
- If any automatic Git condition is not satisfied, stop before stage/commit/push and report the reason plus the recommended next action.

## Automatic Git Conditions
- Automatic stage/commit/push is allowed only when all of these are true:
  - Starting branch is `master`.
  - Starting `origin/master...HEAD` is ahead `0`, behind `0`.
  - Starting working tree is clean.
  - Changes are inside the user-requested scope.
  - No unexpected files changed.
  - No actual secret, production URL, token, account ID, or production binding is included.
  - No dependency or lockfile change is included.
  - No DB migration is included.
  - Required build and tests pass.
  - `git diff --check` passes.
  - `git diff --cached --check` passes.
  - No force push, amend, reset, clean, checkout, rebase, or destructive Git operation is used.
- If automatic push is allowed, push only with `git push origin master`.

## Stop Before Commit Cases
- In these cases, proceed through scoped edits and safe validation, then stop before stage/commit/push and report the result:
  - Visual design, layout, PDF output, responsive behavior, or generated document format changes that require direct user judgment.
  - Broad UI structure changes or product-policy choices where several valid outcomes require user selection.
  - The user explicitly asks to stop before commit, asks for report-only work, or labels the task as a checkpoint before commit.
  - Required validation is blocked, fails outside the requested scope, or depends on manual browser/session evidence that has not been supplied.
- When stopping before commit, keep the working tree intact and report exact next commands or decisions needed.

## Safe Work Without Extra Confirmation
- Reading repository files, tracing references, checking docs/audits, and inspecting existing tests or scripts is allowed.
- Read-only Git commands such as `git status`, `git status --short`, `git status --branch --short`, `git diff`, `git diff --check`, `git diff --cached`, `git diff --cached --check`, `git log`, `git show`, `git branch --show-current`, and `git rev-list --left-right --count` are allowed.
- Scoped code, UI, logic, import, comment, and documentation edits inside the requested files or feature area are allowed when they are safe and reversible.
- Adding a new file is allowed only when it is clearly required by the requested change and does not replace or delete an existing file.
- Small unused-file deletion is allowed only when references are checked and build/tests validate the deletion. Bulk deletion, moves, and broad renames still require explicit approval.
- Safe verification such as build, lint, typecheck, existing contract tests, mutation audits, PowerShell parse checks, dry-run commands, plan-mode commands, and simulator checks without DB/R2 mutation is allowed.
- Prefer `tools/pipeline/approved-workflow.ps1 -Action Verify` over ad hoc individual validation commands when an available profile covers the changed area.
- If a matching `verify-safe.ps1` profile exists, do not repeatedly run individual `node tests/...`, `npm run build`, or `npm run audit:wafl-mutations` outside the wrapper except for a first syntax/contract check immediately after creating a new test.
- Reuse a PASS verification result for the same working tree when the result profile, HEAD, explicit path set, and changed fingerprint match. Do not rerun Mutation Audit only to get finding/high-risk counts; read them from the verification result.
- `tools/pipeline/approved-workflow.ps1 -Action Verify`, `tools/pipeline/approved-workflow.ps1 -Action Handoff`, and `tools/pipeline/approved-workflow.ps1 -Action Plan` are read/validation-only commands. They may still need Codex app OS approval when writing pipeline output files outside the workspace.
- If a safe validation fails and the cause is inside the requested scope, fix it and rerun the same validation when reasonable.
- Under the automatic version workflow, explicit-path staging, ordinary commit, `git push origin master`, and post-push Git state checks are allowed when all automatic Git conditions are satisfied.

## Approved Read-Only Runtime Correction Loop
- When the owner explicitly approves a bounded version scope, Codex may repeat diagnosis, a minimal in-scope fix, static verification, and dev/test read-only runtime verification without asking again for every retry.
- The loop is allowed only while all changed files stay inside the approved version scope, the approved dev/test target fingerprint is unchanged, DB/API access is read-only, no DB/R2/Worker/PDF or production mutation occurs, and root package/lockfile/dependencies remain unchanged.
- Preserve a failure source ZIP, failure repo-state, and failure log under `Logs/Repo_Status/Failure_Handoff` for every failed attempt. Do not place failure artifacts in `4. Newest`, and do not change `4. Newest` before successful Finish.
- Unless the owner sets a different limit, stop after at most three diagnosis/fix/static/runtime cycles. Stop immediately when the same error repeats or the bounded loop does not resolve the failure.
- Static, build, and type errors may be corrected inside the same bounded loop when the fix remains in scope.
- Stop and request explicit owner approval before migration apply, seed, cleanup, reset, rollback, schema validation, destructive SQL, any DB/data/R2/Worker/PDF/production mutation, a target fingerprint change, an unclear dev/test target, an unexpected write, tenant leak, RLS bypass, data-integrity mismatch, partial mutation, unclear ledger state, an out-of-scope file change, or a dependency/root package/lockfile change.

## Actions Requiring Explicit Approval
- Production DB, production R2, production APIs/bindings, secrets, tokens, account IDs, and production URLs require explicit approval before access or use.
- Reset, Seed execute mode, Cleanup execute mode, Migration execution or creation, destructive SQL, broad UPDATE/MERGE, and any DB/R2 mutation require explicit approval.
- `git add`, `git rm`, `git commit`, and `git push` require explicit approval unless the automatic version workflow and all automatic Git conditions apply. Force push, amend, reset, clean, checkout, restore, branch deletion, rebase, merge, and cherry-pick always require explicit approval.
- Bulk file deletion, file moves, broad renames, dependency installs, dependency removals, dependency version changes, package manager changes, lockfile creation, and lockfile changes require explicit approval.
- DB schema changes, authentication/authorization policy changes, tenant-isolation changes, and user-data-shape changes require explicit approval unless the user directly requested that exact change.
- Production data access, actual Seed/Reset/Cleanup/Migration, DROP/TRUNCATE/DELETE SQL, R2 object creation/deletion, dependency or lockfile changes, force/amend/reset/clean/checkout/rebase, and committing with failed required tests always require a stop-and-ask confirmation.
- Do not use `git add .`, `git add -A`, or `git commit -am`. Stage only approved files by explicit path.

## Version Policy
- The app display version is `APP_VERSION` in `lib/constants/version.ts`.
- `package.json` `version` is npm package metadata and is not the app display version.
- For patch work, keep `APP_VERSION`, `commit-meta.md` `Version`, and the reported result version aligned.
- Do not change `package.json` or lock files unless the user explicitly approves dependency/package metadata changes.
- Do not bump `APP_VERSION` for Codex operating-rule documentation updates alone unless the user explicitly asks for a versioned patch.
- `commit-meta.md` is ignored local metadata; do not stage it.

## Data And Environment Safety
- Never print `.env.local`, DB URLs, credentials, tokens, or secrets.
- Never modify production DB or production R2.
- The dev/test simulator fixture prefix is `wafl-fn`.
- Simulator companies use deterministic IDs and display names; keep both stable:

| Code | Company ID | Display name |
|---|---|---|
| A | `wafl-fn-company-a` | 기본 운영사 |
| B | `wafl-fn-company-b` | 협업 운영사 |
| C | `wafl-fn-company-c` | 승인 대기사 |
| D | `wafl-fn-company-d` | 파일 반려사 |
| E | `wafl-fn-company-e` | 이용 중지사 |
| F | `wafl-fn-company-f` | 탈퇴 요청사 |
| G | `wafl-fn-company-g` | 인원 한도사 |
| H | `wafl-fn-company-h` | 대량 운영사 |
| I | `wafl-fn-company-i` | 과거 데이터사 |
| J | `wafl-fn-company-j` | 경계값 전용사 |
- DB/R2 destructive commands require explicit user approval.
- PowerShell menu 9 `Reset Database Schema` must keep production/runtime/fingerprint/prefix/confirmation guards before any SQL runner call.
- Normal test artifacts and logs may be generated by approved test commands, but keep them distinct from source changes.

## Runtime And Access Guards
- `/id-control`, `/roadmap`, `/ui`, and `/functions` are system-administrator-only internal read/view screens and must be accessible to authenticated active system-admin users regardless of runtime mode, including Vercel preview/production deployments.
- General users, customer administrators, workers, and unauthenticated users must remain blocked from direct URL access to `/id-control`, `/roadmap`, `/ui`, and `/functions`.
- Runtime/environment guards must protect dangerous actions, not the system-admin page view. Seed, Reset, Full Reset, Cleanup, DB mutation, R2 create/delete, destructive simulator actions, fixture creation/deletion, and schema execution remain dev/test-only and require their existing action-specific guards.
- `/dev/test-console` must remain production-blocked, explicitly enabled, and guarded before redirecting to `/id-control`; `/id-control` itself may show read-only account/runtime/impersonation state when execution is unavailable.
- `/roadmap` is a system-administrator-only read-only screen. It must not add edit/save/delete actions, DB writes, R2 writes, or URL/query/localStorage mutation paths without a separate explicit policy decision.
- User-facing text on `/roadmap` should be Korean by default. When roadmap plans change, update the canonical data under `lib/internal/roadmap/`, keep `lib/internal/productizationRoadmap.ts` as a compatibility facade if still used, and update `docs/productization-roadmap.md`.
- Before starting a new version feature task, read the canonical roadmap detail for that version and treat it as the current work contract. If user chat or older docs conflict with the latest canonical roadmap and `docs/codex-current-state.md`, prefer the canonical roadmap and current-state.
- Do not expand roadmap detail scope on your own. If success conditions cannot be met, do not mark the roadmap item complete.
- After version work finishes, update the roadmap result with actual applied work, verification result, commit hash, push state, remaining issues, and user confirmation status.
- UI, responsive, and PDF work that requires human judgment must remain `사용자 확인 필요` until user confirmation is complete, even when automatic tests pass.
- If the next user instruction is only "next version" or similar, read the next planned roadmap detail before implementing.
- Impersonation must use an allowlist, support returning to the original session, and keep audit logs.
- Maintain tenant isolation in UI, API, repository, DB, and simulator flows.
- Validate permissions in both UI affordances and API/server handlers.

## Git And Delivery
- Do not commit or push unless the user explicitly approved it or the automatic version workflow conditions are fully satisfied.
- Do not run `git reset`, `git checkout`, `git clean`, or equivalent destructive commands unless explicitly requested.
- For automatic version work, prefer `tools/pipeline/approved-workflow.ps1 -Action Finish` over separate `git add`, `git commit`, and `git push` commands. It still performs Git writes through `finish-version.ps1`, so one version-scoped execution approval may remain necessary in the Codex app.
- If `approved-workflow.ps1` fails, do not bypass it by manually assembling `node`, `npm`, `git add`, `git commit`, or `git push` commands. Report the blocker, fix the wrapper or verification result when the cause is in scope, and rerun the wrapper.
- For automatic version work, stage only in-scope files by explicit path, run `git diff --cached --check`, commit, push, and report the staged/committed/pushed result in the final report instead of pausing at each step.
- For non-automatic Git work, before staging, report the exact files and command. After staging, report the full staged file list.
- For non-automatic Git work, before committing, run `git diff --cached --check`, then report the staged file list and diff summary.
- Before pushing, verify branch, remote, ahead/behind count, and working tree state. Automatic pushes must target `origin master` only.
- Force push is always forbidden unless the user explicitly changes this rule for a one-off recovery operation.
- Do not hide failed or skipped tests. Report what ran, what did not run, and why.
- Final reports should include: original version, result version, files changed, tests run, failures/skips, DB migration status, git status, and whether commit/push were performed.
- For automatic version work, the normal `approved-workflow.ps1 -Action Finish` creates the latest ChatGPT handoff artifacts in `4. Newest` after commit/push unless `-SkipHandoff` is explicitly used. Report the ZIP, repo-state, and build-result filenames and whether APP_VERSION/HEAD match.
- A version is not complete after `approved-workflow.ps1 -Action Finish` unless `4. Newest` contains exactly one final source ZIP and one matching repo-state for the current `HEAD` and `APP_VERSION`.
- The matching build-result and verification log must remain under `Logs/Repo_Status`, and the repo-state must reference them.
- Remove prior-version or duplicate handoff artifacts from `4. Newest`; source ZIPs must apply the complete exclude contract, including every `.env*` file.
- `commit-meta.md` remains ignored local patch metadata and must not be staged or committed.
- The canonical PowerShell entry point is `tools/pipeline/peacebypiece-auto-pipeline.ps1` and should be tracked in Git. Old version, patch, backup, temporary, and copied PowerShell variants remain ignored.
- When Git is directly connected, full ZIP uploads, repo-state files, and separate PowerShell uploads are unnecessary operating overhead unless the user asks for them. A separate PowerShell upload is only useful when a newer external script copy exists or the task is explicitly script-only.

## Communication And Reporting
- Answer in Korean by default for project work unless the user asks otherwise.
- Explain results in user-facing terms; do not return raw logs without summarizing what they mean.
- Ask questions only when the answer is truly needed. When asking, state the recommended option first and briefly explain why user judgment is required. Prefer yes/no confirmation for genuinely risky actions.
- Do not repeatedly ask the user to choose already-settled policies or purely technical implementation details.
- For normal completion reports, include original version, result version, development progress, productization progress, Git status, what was checked, what changed, changed files, tests run, failures/skips, commit hash/message when committed, push result when pushed, direct user-confirmation items, next work, DB migration status, PowerShell change status, whether ZIP/repo-state/PowerShell upload is needed, and whether a new Codex/ChatGPT conversation is needed.
- For short intermediate updates, keep the report concise and focused on what changed or what was learned.
- When a version is marked as a checkpoint, report completion and wait. Do not automatically start the next version or follow-up task.

## Manual Verification Guidance
- Final reports must clearly separate automatic validation from user manual verification.
- If UI behavior changes, include the exact route or menu path, account role/permission, target devices when relevant, actions to perform, expected before/after difference, empty/loading/error/forbidden states, refresh/re-login expectations, and the normal completion criteria.
- If DB values or persistence behavior changes, explain the table/entity/repository/API path, which values change, which values must remain unchanged, save timing, refresh persistence, whether a real DB mutation was executed, and whether the user needs a read-only SQL check.
- If a workflow changes, describe the user action sequence, permission check, API/server handling, DB write or read, R2/PDF/Worker involvement, screen result, failure/recovery message, and repeated-click/refresh/network-delay behavior.
- If permissions change, distinguish system administrator, customer administrator, general user, partner/external user, dev/test account, and no-permission user where relevant. Report accessible routes, visible buttons, allowed read/create/update/delete actions, blocked actions, and whether permission changes apply immediately.
- If storage or R2 behavior changes, report plan quota, current usage, DB and R2 aggregation method, usage formula, warning/block thresholds, expected test-company usage, UI/database consistency criteria, whether R2 objects were actually created/deleted, and dev/test versus production separation.
- If PDF behavior changes, report generation state, button location, included data, workorder versus supplier/material-order purpose, temporary versus final PDF behavior, R2 storage, regeneration, download/print method, filename rules, screen/PDF comparison points, and actual Worker/R2 call status.
- If no user manual verification is needed, state that explicitly and explain why automatic validation is sufficient.

## Test Execution Environment
- If Node execution fails inside the Codex sandbox because of permissions or environment limitations, first try the existing project PowerShell pipeline or another safe already-available runtime path.
- Do not install dependencies, change lockfiles, or make permanent system environment changes without explicit approval.
- If validation still cannot run, distinguish code failure from environment failure, provide the minimal user-run commands in one batch, and continue the same task after the user provides results.

## Tool And Approval Settings
- Codex approval settings cannot be changed from this file, and the Codex app OS execution approval UI cannot be bypassed by repository rules. The recommended operating posture is: auto-allow repository file reads, safe scoped edits, read-only Git commands, and safe validation; ask for network writes, Git index/history/remote changes, dependency changes, DB/R2 mutation, production access, and destructive commands.
- Use wrappers to reduce approval count, not to broaden permission. Do not encourage broad always-approve prefixes such as all `powershell`, all `node`, or all `git`. Prefer exact read/validation commands or version-scoped wrapper commands.


## Korean And Unicode Encoding
- General source, documentation, JSON, YAML, SQL, and configuration text must be UTF-8 with LF line endings.
- PowerShell `.ps1`, `.psm1`, and `.psd1` files executed by Windows PowerShell 5.1 must be UTF-8 with BOM.
- Preserve Korean and other Unicode file and folder names. Do not rename them to English only to avoid encoding issues.
- Treat GitHub and `git ls-files` as the path source of truth. Do not rename a path solely because a ZIP extraction or analysis tool displays mojibake.
- Never mass-rewrite files through an encoding conversion command without a manifest, byte-level evidence, and explicit approval.
- Repair corrupted Korean text only when the original can be proven from Git history, GitHub, or another canonical source. Do not guess missing text.
- Before finishing any patch that touches Korean paths or text, run `node tests/unicode-encoding-contract.mjs`. For PowerShell changes, also run `node tests/pipeline-powershell-encoding-contract.mjs`.
- Patch ZIPs and full handoff ZIPs must preserve Unicode entry names. Verify Korean paths after ZIP creation before delivery.
- The canonical detailed standard is `docs/project/25-korean-unicode-encoding-standard.md`.

## WAFL v2 0.30.0-alpha.12 operational policy absorption rule

For WAFL v2 implementation work, `docs/project/v2/13-v1-gap-review.md` and `docs/project/v2/14-operational-policy-absorption.md` must be read after `docs/project/v2/12-codex-working-rules.md`.

The gap review and absorption document clarify that v2 replaces the Product/Sheet/Card product center, but it does not discard confirmed business, signup, billing, storage, DB, R2, PDF, deletion, QA, and production safety policies from existing project docs. The recommended first narrow Codex implementation after alpha.12 is the mock-only `/ui` showroom work order in `docs/codex-prompts/0.30.0-alpha.13-v2-ui-showroom-prototype.md`.
