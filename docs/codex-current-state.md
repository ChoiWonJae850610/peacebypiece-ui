# Codex Current State

## Version

- Current result version: `0.24.05`
- App display version source: `lib/constants/version.ts`
- `package.json` version remains `0.5.637` npm package metadata and is not the app display version.

## Repository

- Repository: `peacebypiece-2.0`
- Current branch at this checkpoint: `master`
- Baseline commit before 0.24.05 work: `da33450a74c573caccc2cae7f51d8b480a3ec3c2`
- PowerShell entry point: `tools/pipeline/peacebypiece-auto-pipeline.ps1`
- Canonical PowerShell entry point is tracked in Git; old version, patch, backup, temporary, and copied PowerShell variants remain ignored.
- Pipeline config: `tools/pipeline/pipeline.config.psd1`
- Root operating rules: `AGENTS.md`

## Canonical Docs

- Current handoff/state: `docs/codex-current-state.md`
- Root operating rules: `AGENTS.md`
- Repository cleanup audit: `docs/audits/repository-source-db-cleanup-audit-0.24.03.md`
- Reset guard hardening: `docs/audits/reset-guard-hardening-0.24.04.md`
- Repository/documentation cleanup result: `docs/audits/repository-documentation-cleanup-0.24.05.md`
- PowerShell pipeline guide: `tools/pipeline/README.md`
- Simulator guide: `tools/simulator/README.md`
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

## Current Audit Findings

- The root app has about 1,856 non-generated files when root `node_modules`, `.next`, `.git`, artifacts, and the Cloudflare worker nested `node_modules` are excluded.
- `cloudflare/pdf-generator-worker/node_modules` previously had about 3,992 tracked files. Its package manifest, lockfile, Wrangler config, source entry, and README support reinstalling dependencies with `npm ci`, so the dependency tree is now treated as generated local install output.
- Generated folders such as `.next`, `artifacts`, `test-results`, `.tmp`, Playwright reports, worker `.wrangler`, and dependency folders should remain outside commits.
- DB metadata read was limited to the approved development/test target in 0.24.03; it found 60 public tables, 120 foreign keys, 60 primary keys, 17 unique constraints, and 270 indexes.
- The DB read emitted the known `pg` SSL mode warning. Treat this as a configuration follow-up, not a test failure.
- Simulator seed remains slow: the last observed full executions were about 600 seconds, mostly consistent with row-by-row writes inside one transaction.

## Known Risks

- PowerShell menu 9 `Reset Database Schema` requires non-production runtime, PostgreSQL URL, approved fingerprint match, `wafl-fn` prefix, and exact `RESET WAF-FN SCHEMA` confirmation before invoking the SQL runner.
- The reset guard contract directly checks the canonical PowerShell script, the shared guard helper, and the `.gitignore` policy that keeps only old/patch/temp variants ignored.
- DB identity logging is sanitized for reset guard and Simulator DB seed output; logs report match/blocked status instead of host, database, URL, or fingerprint.
- Worker dependency reproducibility now depends on `cloudflare/pdf-generator-worker/package-lock.json`; do not change `package.json` or lockfiles without explicit approval.
- `commit-meta.md` is ignored by Git, so it can record local handoff metadata but is not preserved in commits.
- Some pending browser/session checks require real Google login and cannot be fully proven by local static checks.

## Pending Tests

`pending-tests.md` tracks manual and environment-dependent checks, especially real Google login, impersonation, production blocking, and PowerShell menu behavior.

## Test Artifacts

- Test reports: `artifacts/test-reports/`
- Simulator temp files: `.tmp/simulator/`
- Next build output: `.next/`
- `artifacts/`, `.tmp/`, and `.next/` are ignored by Git, so normal reports and build outputs may be regenerated without source changes.

## Near Plan

- `0.24.06`: Simulator seed performance plan: batch writes, unchanged fixture skip, table timing logs, and company H load split.
- `0.24.06`: Continue source/SQL/fixture cleanup review using the 0.24.03 and 0.24.05 audit classifications.
- `0.24.06`: Prepare full integration test checkpoint when environment-dependent checks are available.
