# Codex Current State

## Version

- Current result version: `0.24.04`
- App display version source: `lib/constants/version.ts`
- `package.json` version remains npm package metadata and is not the app display version.

## Repository

- Repository: `peacebypiece-2.0`
- Current branch at this checkpoint: `master`
- Baseline commit before 0.24.04 work: `3c6201b4369b05f1e094a0b13bc1e67dee102adb`
- PowerShell entry point: `tools/pipeline/peacebypiece-auto-pipeline.ps1`
- Canonical PowerShell entry point is tracked in Git; old version, patch, backup, temporary, and copied PowerShell variants remain ignored.
- Pipeline config: `tools/pipeline/pipeline.config.psd1`
- Root operating rules: `AGENTS.md`

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

## Current Audit Findings

- The root app has about 1,856 non-generated files when root `node_modules`, `.next`, `.git`, artifacts, and the Cloudflare worker nested `node_modules` are excluded.
- `cloudflare/pdf-generator-worker/node_modules` is tracked and contains about 3,992 files; it should be reviewed as a dependency hygiene item before any delete/move.
- Generated folders such as `.next`, `artifacts`, `test-results`, `.tmp`, and Playwright reports are ignored and should remain outside commits.
- DB metadata read was limited to the approved development/test target; it found 60 public tables, 120 foreign keys, 60 primary keys, 17 unique constraints, and 270 indexes.
- The DB read emitted the known `pg` SSL mode warning. Treat this as a configuration follow-up, not a test failure.
- Simulator seed remains slow: the last observed full executions were about 600 seconds, mostly consistent with row-by-row writes inside one transaction.

## Known Risks

- PowerShell menu 9 `Reset Database Schema` now requires non-production runtime, PostgreSQL URL, approved fingerprint match, `wafl-fn` prefix, and exact `RESET WAF-FN SCHEMA` confirmation before invoking the SQL runner.
- The reset guard contract directly checks the canonical PowerShell script, the shared guard helper, and the `.gitignore` policy that keeps only old/patch/temp variants ignored.
- DB identity logging is sanitized for reset guard and Simulator DB seed output; logs report match/blocked status instead of host, database, URL, or fingerprint.
- The Cloudflare worker package has its own lock and nested dependency tree under source control; deletion is not safe until deploy/runtime expectations are confirmed.
- `commit-meta.md` is ignored by Git, so it can record local handoff metadata but is not preserved in commits.
- Some pending browser/session checks require real Google login and cannot be fully proven by local static checks.

## Pending Tests

`pending-tests.md` tracks manual and environment-dependent checks, especially real Google login, impersonation, production blocking, and PowerShell menu behavior.

## Test Artifacts

- Test reports: `artifacts/test-reports/`
- Simulator temp files: `.tmp/simulator/`
- Next build output: `.next/`
- `artifacts/` and `.next/` are ignored by Git, so normal reports and build outputs may be regenerated without source changes.

## Near Plan

- `0.24.05`: Review tracked Cloudflare worker dependency tree, document deploy/install policy, and start docs merge/legacy file cleanup decisions.
- `0.24.06`: Simulator seed performance plan: batch writes, unchanged fixture skip, table timing logs, and company H load split.
