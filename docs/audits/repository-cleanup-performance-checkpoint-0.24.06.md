# Repository Cleanup And Performance Checkpoint 0.24.06

## Executive Summary

0.24.06 is a checkpoint for unused code/SQL/fixture review, Simulator Seed performance analysis, DB query/index review, and integration-test planning.

This checkpoint does not authorize automatic follow-up work. Do not proceed to 0.24.07, stage, commit, or push without a new explicit user request.

No production DB/R2 access was performed. No Reset, Seed, Cleanup, Migration, index creation, destructive SQL, dependency install/update, commit, or push was performed during this checkpoint work.

## Start State

| Check | Result |
|---|---|
| Branch | `master` |
| Baseline HEAD | `f62746a0fd85aa1255e166456987af07617c392d` |
| `origin/master...HEAD` after 0.24.05 push | `0 0` |
| Original APP_VERSION | `0.24.05` |
| Result APP_VERSION | `0.24.06` |
| `package.json` version | `0.5.637`, unchanged |

## Cleanup Candidate Review

| Item | Reference evidence | Classification | 0.24.06 handling |
|---|---|---|---|
| `.next`, `artifacts`, `.tmp`, `test-results`, `playwright-report`, root `node_modules` | Ignored generated/local outputs from build, tests, and package installs | DELETE-SAFE local-only | Not deleted; cleanup requires explicit user request. |
| `cloudflare/pdf-generator-worker/node_modules` | Removed from Git tracking in 0.24.05; worker package manifest and lockfile remain | Completed | No further action. |
| `pnpm-lock.yaml` | `rg pnpm` found no active npm script use; references are old docs/audit notes and one historical QA plan | DELETE-REVIEW | Not deleted until package-manager policy is explicitly decided. |
| `features/materials/__fixtures__/materialsMock.ts` | No direct import/export reference found by `rg` for `materialsMock`, `MATERIAL_SUMMARY_ITEMS`, or `MATERIAL_MOCK_ITEMS` | DELETE-REVIEW | Not deleted; fixture may still be useful for future mock/UI recovery and needs TypeScript parse/use confirmation before removal. |
| `lib/data/sample/attachments.ts`, `partners.ts`, `system.ts` | No direct reference found for exported sample factories/constants | DELETE-REVIEW | Not deleted; sample data may be historical fallback/mock material and should be reviewed with route/UI ownership. |
| `lib/repositories/dbWorkorderRepository.ts` and `lib/workorder/repository/*` | No direct `dbWorkorderRepository` import found, but repository boundary is broad and historical overlap is known | UPDATE-MERGE REVIEW | Not merged or deleted; requires dependency map and owner decision. |
| `tools/simulator/README-r2-demo-files.md` | Referenced by audits; content still included stale reset/upload guidance | UPDATE-MERGE | Replaced with a safe local-only companion note that points to the main simulator README and keeps upload/delete blocked. |
| `scripts/run-sql-files.mjs` | Referenced by guarded PowerShell menu 9 reset path; broad SQL runner remains high risk if called directly | PROTECTED/REVIEW | Not changed; must remain behind reset guard for destructive use. |
| `db/schema`, `db/migrations`, `db/seed`, `db/test` | Referenced by manifest, docs, smoke tests, and historical migration chain | PROTECTED/KEEP | Not changed; no SQL was executed. |

## Seed Performance Analysis

Seed was not executed. Findings are from `tools/simulator/commands/db-data.mjs`, fixture shape, and prior audit notes.

Likely bottlenecks:

- One transaction wraps the full seed for all companies.
- Company H amplifies row-by-row loops for users, members, permissions, partners, workorders, material orders, lines, and allocations.
- Member permissions are deleted and reinserted member-by-member.
- `item_categories` are deleted and rebuilt per company even when the fixture has not changed.
- The seed has no per-stage timing logs, so the current 600-second estimate cannot be attributed by table.
- Repeated `await client.query` calls dominate the hot path more than connection setup; the pool uses `max: 1` and one acquired client.

Recommended timing checkpoints:

| Stage | Measurement point |
|---|---|
| per-company total | Start/end around each company row in `seed(client, plan)` |
| users/members/permissions | Separate timers around the member loop and permission write path |
| categories | Timer around category delete/rebuild |
| partners/items | Timer around partner and partner item writes |
| workorders/orders | Timer around `spec_sheets` and `orders` writes |
| material orders | Timer around orders, lines, and allocations |
| storage snapshots | Timer around delete/insert snapshot block |

Safe optimization candidates:

- Add dry-run and execute report fields for stage timings without changing data order.
- Batch member permission inserts per member scenario with `INSERT ... SELECT` or `unnest`, preserving the same permission set.
- Batch fixture rows per table with deterministic IDs and `ON CONFLICT`, after proving row counts and integrity remain identical.
- Add unchanged-fixture skip only when a fixture hash per company/table is stored or recomputed safely and does not skip integrity checks.
- Split execution modes for quick smoke, permissions-only, storage-only, and full seed.

Do not optimize by weakening runtime/fingerprint/prefix/confirmation guards, changing fixture meaning, skipping tenant isolation checks, or changing company A-J IDs/names.

## DB Query And Index Review

No DB access, EXPLAIN, migration, or index creation was performed.

Existing schema already contains many company-scoped and filtered indexes for active workorders, attachments, material orders, partners, stats snapshots, and trash/purge flows. Additional indexes require measured query evidence.

Candidates that need EXPLAIN on a non-production approved target:

| Candidate | Source evidence | Existing index context | Required validation |
|---|---|---|---|
| Admin stats dashboard aggregations | `lib/admin/adminStats.repository.ts` runs many grouped counts over `spec_sheets`, `orders`, `attachments`, and categories | Multiple `spec_sheets_company_*`, `orders_company_*`, and `attachments_company_*` indexes exist | Capture representative `EXPLAIN (ANALYZE, BUFFERS)` for each slow panel query before proposing any index. |
| Admin file list/trash list | `lib/admin/adminFiles.serverActions.ts` sorts by `created_at`, `deleted_at`, and purge fields | `attachments_company_active_idx`, `attachments_company_deleted_type_idx`, and trash indexes exist | Validate whether current filtered indexes are used for list and purge candidate queries. |
| Member list permissions aggregation | `lib/admin/members/memberRepository.ts` aggregates permissions and sorts by approval/created time | `company_members_company_status_idx`, `member_permissions_unique`, and permission indexes exist | EXPLAIN list query under a large company fixture before adding compound indexes. |
| Material order list/detail | `lib/material-orders/repository.ts` sorts by created time and filters by status/company | `material_orders_company_status_idx`, due date, supplier, requester indexes exist | Check actual filters and sort plans for high-count companies. |
| Partner master list | `lib/partners/dbPartnerRepository.ts` sorts by partner name and joins partner items/processes | `partners_company_name_idx`, `partner_items_company_*` indexes exist | EXPLAIN joined list by partner type/process before adding covering indexes. |

## Integration Checkpoint

Static/build/contract validation should cover the safe checkpoint scope. Real browser login, production-blocking verification, and guarded DB/R2 execute flows remain manual or environment-dependent.

Recommended validation set:

- `git diff --check`
- PowerShell parse check for `tools/pipeline/*.ps1`
- `tests/reset-schema-guard-contract.ps1`
- `tests/functions-environment-audit-contract.mjs`
- `tests/dev-test-context-system-admin-contract.mjs`
- `tests/simulator-adapter-plan-contract.mjs`
- `tests/simulator-db-adapter-contract.mjs`
- `tests/simulator-category-tree-contract.mjs`
- `npm run audit:wafl-mutations`
- `npm run build`
- `npm run simulator:adapter:plan`
- `npm run simulator:db:seed:dry-run`
- `npm run simulator:r2:plan`

Full E2E remains possible only when the local browser/session environment and required test fixtures are available. Do not run DB/R2 execute paths for this checkpoint without explicit approval.

## 0.24.03 Residual Status

| Class | Result |
|---|---|
| DELETE-SAFE | Generated/local outputs remain ignored and were not deleted. |
| DELETE-REVIEW | `pnpm-lock.yaml`, feature mocks, sample data, and repository overlap remain review items. |
| ARCHIVE | Historical docs were not moved; an index refresh should precede archive moves. |
| UPDATE-MERGE | R2 simulator companion README was narrowed to safe local guidance; repository overlap and root docs refresh remain deferred. |

## Applied Changes

| Path | Change |
|---|---|
| `lib/constants/version.ts` | Updated `APP_VERSION` to `0.24.06`. |
| `docs/codex-current-state.md` | Updated current state, audit references, and near plan for 0.24.06. |
| `docs/audits/repository-cleanup-performance-checkpoint-0.24.06.md` | Added this checkpoint audit. |
| `tools/simulator/README-r2-demo-files.md` | Replaced stale upload/reset guidance with safe local-only companion guidance. |
| `commit-meta.md` | Updated ignored local handoff metadata to `0.24.06`. |

## Deferred Items

- Do not delete `pnpm-lock.yaml` until npm-only policy is explicitly approved.
- Do not delete mocks/sample data until TypeScript parse issues, ownership, and route usage are resolved.
- Do not merge repository layers without a dependency map and focused test plan.
- Do not add DB indexes until non-production EXPLAIN evidence exists.
- Do not run Seed/Reset/Cleanup/Migration/R2 mutation as part of this checkpoint.
