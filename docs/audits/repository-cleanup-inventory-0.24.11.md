# Repository Cleanup Inventory 0.24.11

## Summary

- Branch: `master`
- HEAD at analysis start: `ebd4166cdfc72522770d0405bed3813234dfd158`
- APP_VERSION: `0.24.11`
- Scope: repository cleanup only
- Version bump: none
- DB/R2/Seed/Reset/Cleanup/Migration execution: none
- Dependency or lockfile changes: none

## Tracked File Summary

Tracked file count before cleanup: 1,871.

| Area | Files |
| --- | ---: |
| docs | 662 |
| lib | 567 |
| components | 347 |
| app | 141 |
| tests | 37 |
| features | 26 |
| db | 22 |
| tools | 20 |
| root | 13 |
| scripts | 12 |
| cloudflare | 9 |
| types | 8 |
| reports | 1 |

## Docs Statistics

| Area | Files |
| --- | ---: |
| docs root | 206 |
| docs/보관문서 | 380 |
| docs/정책문서 | 32 |
| docs/현재기준 | 34 |
| docs/audits | 10 |

Docs root has been reduced through docs cleanup batch 1 and batch 2. Remaining version-specific implementation reports should continue to move by manifest instead of ad hoc deletion.

## Classification

| Classification | Items |
| --- | --- |
| KEEP | `app/`, `components/`, `features/`, `lib/`, `tests/`, `scripts/`, active `tools/`, active `cloudflare/r2-upload-worker.js`, active `cloudflare/pdf-generator-worker/`, `pending-tests.md`, current docs |
| MERGE | README/current-state drift, remaining repeated release/build/QA docs, billing/storage docs |
| ARCHIVE | docs root version reports, Playwright setup history, simulator version reports, billing/storage implementation reports |
| DELETE-SAFE | exact duplicate `docs/보관문서/wafl-a-type/wafl-ui-system-0.19.50.md` after hash/ref check; tracked ignored legacy report after ref check |
| DELETE-REVIEW | `pnpm-lock.yaml`, deprecated Cloudflare PDF single-file/example config, broad docs root archive moves, empty active-source folders |
| PROTECTED | `db/schema/*`, `db/migrations/*`, `db/seed/*`, lockfiles, auth/permission/policy/legal files, tenant-isolation code, Cloudflare active deploy files |
| GENERATED-LOCAL | `.next/`, `.tmp/`, `artifacts/`, `playwright-report/`, `test-results/`, `node_modules/`, `cloudflare/pdf-generator-worker/node_modules/`, `.env.local` |

## Broken References

| Reference | Status | Action |
| --- | --- | --- |
| `db/schema/patch_0_10_48_system_standards_seed_refresh.sql` | Missing file referenced by system standards UI/message | Replaced with canonical `db/seed/system_standards_seed.sql` guidance |
| `docs/보관문서/wafl-a-type/00-문서-목록.md` links 81-89 | Old English slug paths did not exist | Repointed to existing Korean file names |

## Exact Duplicates

| Hash | Kept | Removed |
| --- | --- | --- |
| `E7BC1E2F0EABC3E1E19CB906F28DA2023E17BCC86BCD04AAEA0B681C00EAE0D8` | `docs/보관문서/wafl-a-type/wafl-ui-system.md` | `docs/보관문서/wafl-a-type/wafl-ui-system-0.19.50.md` |

The version-suffix duplicate had no active code/script/test/pipeline references. Historical docs mention the prior move, but the unsuffixed file is the canonical retained copy.

## Generated And Legacy Output

| Path | Status | Action |
| --- | --- | --- |
| `reports/functions-pdf-contract-latest.json` | Tracked ignored legacy report; direct refs 0 | Removed |
| `artifacts/test-reports/functions/` | Current ignored report location for functions reports | Kept ignored |
| `cloudflare/pdf-generator-worker/node_modules/` | Generated local dependency install output | Kept ignored |
| `cloudflare/pdf-generator-worker/.wrangler/` | Generated local Wrangler state | Kept ignored |

## DB Migration And Full Reset

| File | Classification | Decision |
| --- | --- | --- |
| `db/schema/full_reset.sql` | PROTECTED | Canonical development reset schema; no change |
| `db/schema/full_reset_smoke_test.sql` | KEEP | Smoke verification helper; no change |
| `db/migrations/patch_0_19_77_company_account_request_system_reviewer.sql` | PROTECTED | Keep as existing DB compatibility/audit history |
| `db/migrations/patch_0_19_82_policy_versions_agreements.sql` | PROTECTED | Keep |
| `db/migrations/patch_0_19_95_company_files.sql` | PROTECTED | Keep |
| `db/migrations/patch_0_20_05_company_subscriptions.sql` | PROTECTED | Keep |
| `db/migrations/patch_0_20_19_company_feedback_requests.sql` | PROTECTED | Keep |
| `db/migrations/patch_0_21_82_material_order_due_date.sql` | PROTECTED | Keep |
| `db/migrations/patch_0_22_57_material_order_header_fields.sql` | PROTECTED | Keep |
| `db/migrations/patch_0_22_92_remove_workorder_memos.sql` | PROTECTED | Keep |
| `db/migrations/patch_0_22_96_workorder_factory_instruction.sql` | PROTECTED | Keep |

The inspected migration themes are reflected in or compatible with `full_reset.sql`, but the migration chain remains protected for existing DB correction and auditability.

## Applied In This Cleanup

- Added this cleanup inventory.
- Added `docs/audits/docs-archive-manifest-0.24.11.md`.
- Refreshed `README.md`, `docs/README.md`, and `db/README.md` to current `0.24.11` repository state.
- Replaced missing system standards seed patch guidance with `db/seed/system_standards_seed.sql`.
- Fixed 9 stale WAFL A-Type archive links to existing file names.
- Removed `reports/functions-pdf-contract-latest.json`.
- Removed duplicate `docs/보관문서/wafl-a-type/wafl-ui-system-0.19.50.md`.
- Added `repository-cleanup` safe verification profile.

## Deferred Items

- `pnpm-lock.yaml` remains until npm-only package manager policy is explicitly confirmed.
- `db/migrations/*` remains unchanged.
- Deprecated Cloudflare PDF single-file/example config remains pending deploy/CI reference review.
- Docs cleanup batch 1 and batch 2 moved or deleted the approved build-fix, Playwright, simulator, WAFL UI, pipeline, workorder, material-order, and modal/focus batches under manifest limits.
- Empty local folders are not Git-tracked and were not removed.

## Verification Plan

Use `tools/pipeline/verify-safe.ps1 -Profile repository-cleanup`. The profile checks:

- PowerShell parse
- `git diff --check`
- package/lockfile unchanged
- DB migration/schema unchanged
- secret/production scan
- `npm run build`
- `npm run audit:wafl-mutations`
- functions PDF contract
- removed report reference absence
- broken SQL path absence
- archive link target existence
- duplicate removal and canonical duplicate retention

## Next Cleanup Step

Use `docs/audits/docs-archive-manifest-0.24.11.md` to move remaining docs root version reports into archive directories. Do not perform a new batch until the exact scope and limit are approved.
