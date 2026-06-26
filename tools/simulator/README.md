# WAFL Simulator

Dev/test-only tools for preparing deterministic `/functions` DB and local R2 simulator data.

- `commands/`: command entry points used by npm scripts and the PowerShell menu.
- `fixtures/`: deterministic simulator source data. The active fixture prefix is `wafl-fn`.
- `adapters/`: guarded DB/R2 adapter manifests and implementation details.
- Generated local output: `.tmp/simulator/`
- Test reports: `artifacts/test-reports/`

The simulator is for non-production validation only. Production DB/R2 targets must remain blocked.

## Local R2 Commands

- `npm run simulator:r2:plan`: print the local fixture generation plan only.
- `npm run simulator:r2:generate`: clear prior local simulator output and generate files/manifests under `.tmp/simulator/r2`.
- `npm run simulator:r2:cleanup-local`: remove only `.tmp/simulator/r2/files` and `.tmp/simulator/r2/manifests`.

These local R2 commands do not touch the real DB or real R2. R2 upload/delete adapter mutation remains disabled.

## Adapter Planning Commands

- `npm run simulator:adapter:plan`: evaluate DB schema, fixture mapping, cleanup order, and R2 prefixes from source files only.
- `npm run simulator:adapter:contract`: verify adapter manifest safety contracts.
- `npm run simulator:db:contract`: verify DB adapter guard, transaction, prefix cleanup, and idempotent seed contracts.
- `node tools/simulator/commands/attachment-lifecycle.mjs --mode=plan`: validate the canonical attachment/R2 lifecycle manifest and write a preflight report without DB/R2 mutation.
- `node tools/simulator/commands/attachment-lifecycle.mjs --mode=generate`: create exact-size local files under `.tmp/simulator/attachments` from the canonical manifest only.
- `node tools/simulator/commands/attachment-lifecycle.mjs --mode=verify`: prepare read-only reconciliation expectations for DB metadata, R2 object bytes, storage snapshot, admin main, and `/workspace/files`.

Planning and contract commands do not connect to DB/R2 and do not mutate data.

## DB Simulator Commands

```bash
npm run simulator:db:contract
npm run simulator:db:seed:dry-run
npm run simulator:db:cleanup:dry-run
npm run simulator:db:seed:execute
npm run simulator:db:cleanup:execute
```

- Dry-run commands never connect to the database.
- Execute commands require a non-production runtime, PostgreSQL URL shape, approved DB fingerprint, `WAFL_SIMULATOR_ENABLE_DB_MUTATION=1`, `wafl-fn` fixture prefix, and an exact confirmation value.
- Seed uses one transaction, an advisory lock, deterministic `wafl-fn` IDs, and idempotent upserts.
- Cleanup deletes only fixture company IDs beginning with `wafl-fn`; database cascades remove dependent rows.
- Console/report output must not print DB URL, host, database name, password, token, secret, bucket, or actual fingerprint values.

## Attachment/R2 Lifecycle Foundation

Canonical manifest:

- `tools/simulator/fixtures/attachments/canonical-lifecycle-manifest.json`

Normal lifecycle fixtures A~G are realistic attachment/R2 cases. Capacity boundary fixtures H~J are separate and must not be treated as normal file objects.

Required normal attachment fields:

- `fixture_id`
- `company_id`
- `workorder_id`
- `attachment_id`
- `attachment_kind`
- `original_filename`
- `mime_type`
- `exact_size_bytes`
- `canonical_r2_key`
- `preview_mode`
- `is_representative_design`
- `lifecycle_status`
- `trashed_at`
- `expected_company_active_bytes`
- `expected_company_trash_bytes`
- `expected_company_total_bytes`

Mutating attachment lifecycle modes require all guards before any future execution:

- dev/test runtime only; production is blocked
- approved Neon DB fingerprint
- approved R2 account/bucket fingerprint
- `WAFL_FUNCTIONS_TEST_PREFIX=wafl-fn`
- `WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION=1`
- exact `WAFL_SIMULATOR_ATTACHMENT_CONFIRM`
- exact manifest R2 keys only, never a whole bucket or broad prefix

This version adds the non-destructive foundation only. Actual R2 upload, Neon attachment seed, lifecycle mutation, cleanup, and fault fixture creation still require a separate user approval after the preflight report.

## PowerShell Menu Mapping

The canonical PowerShell entry point is `tools/pipeline/peacebypiece-auto-pipeline.ps1`.

- Menu 14: Functions Seed Dry-run, safe/no mutation.
- Menu 15: Functions Cleanup Dry-run, safe/no mutation.
- Menu 21: Simulator DB Seed Execute, guarded DEV/TEST mutation.
- Menu 22: Simulator DB Cleanup Execute, guarded DEV/TEST destructive cleanup.
- Menu 24: Simulator R2 Plan, safe/no mutation.
- Menu 25: Simulator R2 Local Generate, local `.tmp` files only.
- Menu 26: Simulator R2 Local Cleanup, local `.tmp` deletion with `CLEAN LOCAL R2` confirmation.
- Menu 27: Simulator Adapter Contract, safe/no mutation.
- Menu 28: Simulator Adapter Plan, safe/no mutation.
- Menu 29: Simulator DB Adapter Contract, safe/no mutation.
- Menu 34: Simulator Attachment Plan, read-only/no mutation.
- Menu 35: Simulator Attachment Local Generate, local `.tmp` files only.
- Menu 36: Simulator Attachment Upload+Seed, DEV/TEST DB/R2 mutation boundary; production blocked; exact confirmation `UPLOAD SEED WAF-FN ATTACHMENTS`; separate approval required before actual execution.
- Menu 37: Simulator Attachment Verify+Reconcile, read-only/no mutation.
- Menu 38: Simulator Attachment Lifecycle Test, DEV/TEST recoverable mutation boundary; production blocked; exact confirmation `RUN WAF-FN ATTACHMENT LIFECYCLE`; separate approval required before actual execution.
- Menu 39: Simulator Attachment Cleanup, destructive DEV/TEST cleanup boundary; production blocked; exact confirmation `CLEAN WAF-FN ATTACHMENTS`; separate approval required before actual execution.
- Menu 40: Simulator Attachment Fault Plan, read-only/no mutation.
- Menu 41: Simulator Attachment Fault Execute, separate explicit fault fixture boundary; production blocked; exact confirmation `CREATE WAF-FN ATTACHMENT FAULTS`; separate approval required before actual execution.

Menu 9 `Reset Database Schema` belongs to the PowerShell pipeline destructive path, not the simulator command set. It must keep the `RESET WAF-FN SCHEMA` confirmation and runtime/fingerprint/prefix guards before any SQL runner call.
