# Codex Current State

## Version

- Current result version: `0.24.02`
- App display version source: `lib/constants/version.ts`
- `package.json` version is npm package metadata, not the app display version.

## Repository

- Repository: `peacebypiece-2.0`
- Current branch at this checkpoint: `master`
- PowerShell entry point: `tools/pipeline/peacebypiece-auto-pipeline.ps1`
- Pipeline config: `tools/pipeline/pipeline.config.psd1`

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

Seed baseline before `0.24.02`:

| Table | Count |
|---|---:|
| companies | 10 |
| company_members | 193 |
| company_users | 193 |
| item_categories | 410 |
| material_orders | 808 |
| orders | 1572 |
| spec_sheets | 1572 |
| storage_usage_snapshots | 10 |

After `0.24.02`, `item_categories` is expected to increase by `30` rows after reseeding because each of the 10 simulator companies receives `크롭 맨투맨`, `니트`, and `기본 니트` nodes through the shared path-based category fixture.

The seed is idempotent under the approved development/test DB guard. The latest observed second seed run completed with ExitCode `0` and took about `591s`.

## Completed

- Simulator DB guard validates non-production runtime, PostgreSQL URL shape, approved DB fingerprint, `wafl-fn` prefix, mutation enable flag, and exact confirmation text.
- Simulator category seeding clears existing `wafl-fn` company categories and recreates deterministic path-based IDs.
- Duplicate `company_users`, `company_members`, category duplicate, orphan parent, legacy category, and invalid work-order category reference checks have passed.
- `/ui` and `/functions` have runtime access guards.
- `/dev/test-console` is production-blocked and requires an explicit enable flag.

## Known Risks

- PowerShell menu 9 `Reset Database Schema` still lacks the same production fingerprint/runtime guard depth as Simulator DB seed.
- Simulator DB seed is slow enough that external wrappers must wait for the actual process exit instead of using short timeouts.
- R2 production/test separation depends on simulator manifests and test prefixes for simulator tooling; general app R2 config is environment-driven.
- Some pending browser/session checks require real Google login and cannot be fully proven by local static checks.

## Pending Tests

`pending-tests.md` tracks manual and environment-dependent checks, especially real Google login, impersonation, production blocking, and PowerShell menu behavior.

## Test Artifacts

- Test reports: `artifacts/test-reports/`
- Simulator temp files: `.tmp/simulator/`
- `artifacts/` is ignored by Git, so normal seed reports and logs may be regenerated without source changes.

## Near Plan

- `0.24.03`: Repository/Source/DB Cleanup Audit.
- `0.24.04`: Strengthen Reset Database Schema runtime/fingerprint guard.
- `0.24.05`: Complete dev/test console impersonation and audit-log verification.
- `0.24.06`: R2 simulator reconciliation and production bucket safety review.
