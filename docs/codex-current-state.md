# Codex Current State

## Version

- Current result version: `0.24.11`
- App display version source: `lib/constants/version.ts`
- `package.json` version remains `0.5.637` npm package metadata and is not the app display version.

## Repository

- Repository: `peacebypiece-2.0`
- Current branch at this checkpoint: `master`
- Baseline commit before 0.24.05 work: `da33450a74c573caccc2cae7f51d8b480a3ec3c2`
- PowerShell entry point: `tools/pipeline/peacebypiece-auto-pipeline.ps1`
- Canonical PowerShell entry point is tracked in Git; old version, patch, backup, temporary, and copied PowerShell variants remain ignored.
- Pipeline config: `tools/pipeline/pipeline.config.psd1`
- Safe verification wrapper: `tools/pipeline/verify-safe.ps1`
- Git finish wrapper: `tools/pipeline/finish-version.ps1`
- Approved workflow wrapper: `tools/pipeline/approved-workflow.ps1`
- Internal system-admin routes: `/id-control` for dev/test identity control and `/roadmap` for read-only productization roadmap.
- Root operating rules: `AGENTS.md`

## Canonical Docs

- Current handoff/state: `docs/codex-current-state.md`
- Root operating rules: `AGENTS.md`
- Repository cleanup audit: `docs/audits/repository-source-db-cleanup-audit-0.24.03.md`
- Reset guard hardening: `docs/audits/reset-guard-hardening-0.24.04.md`
- Repository/documentation cleanup result: `docs/audits/repository-documentation-cleanup-0.24.05.md`
- Repository cleanup/performance checkpoint: `docs/audits/repository-cleanup-performance-checkpoint-0.24.06.md`
- Productization roadmap: `docs/productization-roadmap.md`
- Productization inventory: `docs/audits/productization-inventory-0.24.07.md`
- Mock/unused cleanup audit: `docs/audits/mock-unused-cleanup-0.24.08.md`
- Customer admin plan/storage audit: `docs/audits/customer-admin-plan-storage-0.24.09.md`
- System admin storage usage audit: `docs/audits/system-admin-storage-usage-0.24.10.md`
- PowerShell pipeline guide: `tools/pipeline/README.md`
- Simulator guide: `tools/simulator/README.md`
- Current testing and automation guide: `docs/현재기준/testing-and-automation.md`
- Current simulator guide: `docs/현재기준/simulator.md`
- Current WAFL UI system guide: `docs/현재기준/wafl-ui-system.md`
- Current workorder guide: `docs/현재기준/workorder.md`
- Current material-order guide: `docs/현재기준/material-order.md`
- Current modal/focus guide: `docs/현재기준/modal-and-focus.md`
- Worker deploy guide: `cloudflare/pdf-generator-worker/README.md`

Historical handoff and design docs remain preserved under `docs/` and `docs/보관문서/`. Do not delete or archive them by age alone; use the audit classifications and reference checks first.

## Simulator Baseline

Simulator DB fixtures use deterministic company IDs:

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

The `0.24.02` seed baseline added `크롭 맨투맨`, `니트`, and `기본 니트` through the shared path-based category fixture. Two approved dev/test seed executions completed with ExitCode `0`; the second execution kept counts stable and preserved duplicate/reference integrity.

## Completed

- Root Codex operating rules exist in `AGENTS.md`.
- `AGENTS.md` now defines the default low-friction automatic version workflow: when a user clearly specifies a version goal and scope, Codex may proceed through scoped analysis, edits, validation, explicit-path staging, ordinary commit, `git push origin master`, and final synchronization reporting without separate confirmation at each Git step, but only when all automatic Git safety conditions are satisfied.
- Simulator DB seed guard validates non-production runtime, PostgreSQL URL shape, approved DB fingerprint, `wafl-fn` prefix, mutation enable flag, and exact confirmation text.
- Simulator category seeding uses deterministic path-based IDs and passed idempotency checks.
- Duplicate `company_users`, `company_members`, category duplicate, orphan parent, legacy category, and invalid work-order category reference checks passed in the 0.24.02 baseline.
- `/ui` and `/functions` have runtime access guards.
- `/dev/test-console` is production-blocked and requires an explicit enable flag.
- 0.24.03 created `docs/audits/repository-source-db-cleanup-audit-0.24.03.md` as a no-delete cleanup audit.
- 0.24.04 hardened PowerShell menu 9 Reset Database Schema guard and added a reset guard contract test.
- 0.24.04 also made the canonical PowerShell entry point trackable by narrowing the old broad `.gitignore` rule for `peacebypiece-auto-pipeline*.ps1`.
- 0.24.05 reviewed the Cloudflare PDF Worker package/deploy flow and removed `cloudflare/pdf-generator-worker/node_modules` from Git tracking while leaving the local install folder untouched.
- 0.24.05 added explicit ignore rules for worker `node_modules` and `.wrangler`.
- 0.24.05 refreshed the Worker and Simulator README files so they match the current lockfile-based deploy flow and implemented guarded simulator adapters.
- 0.24.06 pushed the verified 0.24.05 cleanup commit to `origin/master`, then reviewed unused code/SQL/fixture candidates without deleting tracked source.
- 0.24.06 narrowed the stale R2 simulator companion README to safe local-only guidance and documented blocked upload/all/verify modes.
- 0.24.06 documented Seed performance bottlenecks and DB query/index candidates without running Seed, DB/R2 mutation, migration, or EXPLAIN.
- 0.24.07 surveyed productization scope and created `docs/productization-roadmap.md` plus `docs/audits/productization-inventory-0.24.07.md`.
- 0.24.07 distinguished feature implementation progress from productization readiness. The older about-93% figure refers to major screen/function skeleton implementation; the `72%` figure was productization readiness including mock removal, real data evidence, permissions, responsive QA, PDF, E2E, and operational safety.
- 0.24.08 revalidated mock/sample/fixture/deprecated/legacy/unused candidates by direct imports, dynamic-import strings, route/API references, tests, scripts, docs, fallback paths, and replacement data paths.
- 0.24.08 deleted only proven-unreferenced source mock/sample files: `features/materials/__fixtures__/materialsMock.ts`, `lib/data/workorderMockData.ts`, `lib/data/sample/*`, `lib/data/mock/fixtureI18n.ts`, and `lib/data/domain/system.ts`.
- 0.24.08 kept `pnpm-lock.yaml`, deprecated Cloudflare Worker/example files, dev/test simulator fixtures, active fallback guards, and repository overlap items as review/merge work rather than deleting them.
- 0.24.08 deletion safety verification is complete: static reference/export graph validation passed, user local Windows PowerShell build passed, Mutation Audit passed with `162 finding(s), 0 high-risk`, and the selected Node contract tests passed.
- Codex sandbox Node execution remained blocked by `Access is denied` for the bundled WindowsApps Node, so the Node-based validation evidence came from the user's local Windows PowerShell on the same repository.
- 0.24.08 updates productization readiness to `74%`; feature implementation progress remains about `93%`.
- After 0.24.08, operating-rule documentation was updated for low-friction automatic development flow without bumping `APP_VERSION`, changing product code, or touching DB/R2; that rule-only change was committed locally as `a05036ca515956d123641dad3852789607452e36` and remains unpushed at the start of 0.24.09 work.
- 0.24.09 added a DB-backed customer-admin `/workspace` plan/storage summary panel. It combines company subscription state, company file-policy quota, attachment/trash metadata usage, and member-limit warnings without dependency, lockfile, DB/R2 mutation, Seed, Reset, Cleanup, or Migration changes.
- 0.24.09 validation passed on the user's local Windows PowerShell: Next.js `16.2.1` Turbopack build compiled successfully, Mutation Audit reported `162 finding(s), 0 high-risk`, and `tests/customer-workspace-compact-dashboard-contract.mjs`, `tests/functions-storage-contract.mjs`, and `tests/simulator-adapter-plan-contract.mjs` passed.
- 0.24.09 updates productization readiness to `76%`; feature implementation progress remains about `93%`.
- 0.24.10 replaces the system storage usage repository's process-local skeleton with DB attachment/trash metadata aggregation for summaries and `storage_usage_snapshots` inserts for explicit snapshots.
- 0.24.10 adds `tests/system-storage-usage-real-data-contract.mjs` to keep `/api/system/storage-usage` system-admin guarded, DB-backed, and connected to dashboard snapshot evidence.
- 0.24.10 updated productization readiness to `78%`; feature implementation progress remained about `93%`.
- 0.24.09 and the preceding operating-rule commit were pushed to `origin/master`; HEAD is `b41642c41e6c81f28a2d4cb3846f4b99071b6ee5` after that version.
- After 0.24.09, `AGENTS.md` was consolidated again to combine automatic development, response style, commit-stop cases, and manual verification guidance into one operating policy without bumping `APP_VERSION` or changing product code.
- After 0.24.10, PowerShell automation was supplemented without bumping `APP_VERSION`: menu 7 local repository handoff now uses Git file candidates, nested generated-folder exclusion, content-aware secret screening, and independent ZIP contract validation; `verify-safe.ps1` and `finish-version.ps1` provide guarded validation and version-finish wrappers.
- After docs cleanup 1차, PowerShell automation adds `approved-workflow.ps1` as the fixed approval entry point for Verify, Handoff, Plan, and Finish. It auto-selects the newest matching PASS verification result by profile, branch, HEAD, changed files, and changed fingerprint before delegating Git writes to `finish-version.ps1`.
- `/id-control` is the guarded replacement route for `/dev/test-console`; the old route redirects only after the same dev/test runtime and active system-admin guard passes. `/roadmap` is an active system-admin read-only view backed by `lib/internal/productizationRoadmap.ts` and synchronized with `docs/productization-roadmap.md`.
- 0.24.11 fills `/roadmap` with Korean version-plan data for 0.24.10 through 0.24.15, updates APP_VERSION to `0.24.11`, keeps feature implementation progress about `93%`, and sets productization readiness to `77%`.
- `verify-safe.ps1` now has an `id-control-roadmap` profile and writes branch, HEAD, changed files, changed fingerprint, command lines, Mutation Audit finding count, and high-risk count into verification result files. `finish-version.ps1` reuses PASS verification results only when profile, HEAD, explicit paths, and changed fingerprint match.
- Repository cleanup 1차 removed the tracked ignored legacy functions PDF report, removed one exact duplicate WAFL UI archive document, and added `repository-cleanup` verification.
- Docs cleanup 1차 consolidates legacy build-fix, Playwright, simulator, WAFL UI, pipeline, and old handoff guidance into current docs, while preserving useful history under `docs/보관문서/`.
- Docs cleanup 2차 consolidated workorder, material-order, and modal/focus history into `docs/현재기준/workorder.md`, `docs/현재기준/material-order.md`, and `docs/현재기준/modal-and-focus.md`. It moved 55 valuable history files under `docs/보관문서/completed-features/` and `docs/보관문서/qa-history/modal/`, deleted 5 one-off mobile/QA notes, and reduced docs root from 266 to 206 without changing `APP_VERSION`.
- Docs cleanup 3차 consolidated billing/storage, responsive/device/layout, and legacy DB smoke history into `docs/현재기준/요금-저장소-정책-설계.md`, `docs/현재기준/wafl-ui-system.md`, and `docs/현재기준/testing-and-automation.md`. It moved 20 history files, deleted 6 superseded one-off cleanup records, reduced docs root from 206 to 180, and closes the 0.24.11 large-scale documentation cleanup without changing `APP_VERSION`.

## Current Audit Findings

- The root app has about 1,856 non-generated files when root `node_modules`, `.next`, `.git`, artifacts, and the Cloudflare worker nested `node_modules` are excluded.
- `cloudflare/pdf-generator-worker/node_modules` previously had about 3,992 tracked files. Its package manifest, lockfile, Wrangler config, source entry, and README support reinstalling dependencies with `npm ci`, so the dependency tree is now treated as generated local install output.
- Generated folders such as `.next`, `artifacts`, `test-results`, `.tmp`, Playwright reports, worker `.wrangler`, and dependency folders should remain outside commits.
- Generated/local folders are classified as `GENERATED-LOCAL` / `GIT-IGNORE`, not product source `DELETE-SAFE`; local cleanup requires an explicit request and is not part of 0.24.07.
- DB metadata read was limited to the approved development/test target in 0.24.03; it found 60 public tables, 120 foreign keys, 60 primary keys, 17 unique constraints, and 270 indexes.
- The DB read emitted the known `pg` SSL mode warning. Treat this as a configuration follow-up, not a test failure.
- Simulator seed remains slow: the last observed full executions were about 600 seconds, mostly consistent with row-by-row writes inside one transaction. 0.24.06 identified timing checkpoints and batch/skip candidates but did not run Seed.
- Route inventory found DB-backed workspace routes for workorders, material orders, materials, partners, files, stats, settings, members, and subscription, with page/API permission guards on most routes.
- `/worker` still renders the workorder workspace directly from the current session and should be redirected, guarded, or explicitly documented as a legacy/internal route before launch.
- Customer admin file storage snapshot is DB-backed, and system storage usage now has DB metadata summaries plus `storage_usage_snapshots` writes. R2 inventory reconciliation display still needs productization.
- Customer admin `/workspace` now surfaces a plan/storage summary from DB-backed subscription, settings, attachment, and trash metadata paths; R2 reconciliation is still not shown on the customer admin main page.
- Workorder PDF generation and R2 attachment registration exist; supplier/material-order PDF remains policy-contract level and needs final route/storage decisions.
- 0.24.08 removed the stale material fixture and unreferenced sample/mock data chain after dependency-map review found no live imports outside historical docs.
- 0.24.08 build, Mutation Audit, and selected contract tests passed after the cleanup without dependency install/update, lockfile change, DB/R2 access, Seed, Reset, Cleanup, or Migration.
- `lib/data/mock/types.ts` remains active because `lib/repositories/workorderRepository.ts` and `lib/repositories/workorderPersistence.ts` use `PersistedWorkOrderState`.

## Known Risks

- PowerShell menu 9 `Reset Database Schema` requires non-production runtime, PostgreSQL URL, approved fingerprint match, `wafl-fn` prefix, and exact `RESET WAF-FN SCHEMA` confirmation before invoking the SQL runner.
- The reset guard contract directly checks the canonical PowerShell script, the shared guard helper, and the `.gitignore` policy that keeps only old/patch/temp variants ignored.
- DB identity logging is sanitized for reset guard and Simulator DB seed output; logs report match/blocked status instead of host, database, URL, or fingerprint.
- Worker dependency reproducibility now depends on `cloudflare/pdf-generator-worker/package-lock.json`; do not change `package.json` or lockfiles without explicit approval.
- `commit-meta.md` is ignored by Git, so it can record local handoff metadata but is not preserved in commits.
- `pnpm-lock.yaml`, deprecated Cloudflare legacy worker/example files, and repository overlap between `lib/repositories/*` and `lib/workorder/repository/*` remain DELETE-REVIEW or UPDATE-MERGE review items, not deletion targets.
- `docs/productization-roadmap.md` is now the product roadmap source; do not put feature backlog or temporary version plans in `AGENTS.md`.
- General version work can now auto-stage, auto-commit, and auto-push to `origin master` only when the `AGENTS.md` automatic Git conditions are all true; otherwise Codex must stop before Git index/history/remote changes and report the blocker.
- Prefer `tools/pipeline/approved-workflow.ps1 -Action Verify/Plan/Finish` over ad hoc validation and manually assembled Git commands when its profile matches the work. The wrappers reduce approval count but do not bypass Codex app OS approval or DB/R2/Git-write safety policy.
- 0.24.09 started while `master` was already ahead of `origin/master` by the local operating-rule commit, so automatic push conditions were not met at first. After user approval and validation, the operating-rule commit and 0.24.09 commit were pushed together.
- DB smoke tests remain not run unless explicitly approved because they create rollback fixtures and require DB access. No DB/R2/Seed/Reset/Cleanup/Migration should run during internal route/roadmap work.
- Some pending browser/session checks require real Google login and cannot be fully proven by local static checks.
- Historical Codex handoff files are not the current handoff source. Use this file plus `AGENTS.md`, `docs/현재기준/`, `tools/pipeline/README.md`, and `tools/simulator/README.md`.
- Historical workorder, material-order, and modal/focus version notes are no longer the current source. Use the current baseline docs first, then archived history only for context.
- Historical billing/storage, responsive/device/layout, and DB smoke version notes are no longer the current source. Use the current baseline docs and active scripts/tests first, then archived history only for context.

## Pending Tests

`pending-tests.md` tracks manual and environment-dependent checks, especially real Google login, impersonation, production blocking, and PowerShell menu behavior.

## Test Artifacts

- Test reports: `artifacts/test-reports/`
- Simulator temp files: `.tmp/simulator/`
- Next build output: `.next/`
- `artifacts/`, `.tmp/`, and `.next/` are ignored by Git, so normal reports and build outputs may be regenerated without source changes.

## Near Plan

- 0.24.11 documentation cleanup is complete. Next recommended work is `0.24.12` general user workspace/`/worker` responsive and save-flow commonization, but do not start it automatically from the cleanup thread.
- Run environment-dependent E2E/manual checks only when browser session and dev/test DB/R2 approvals are available.
