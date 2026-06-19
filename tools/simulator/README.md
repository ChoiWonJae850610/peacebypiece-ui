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

Menu 9 `Reset Database Schema` belongs to the PowerShell pipeline destructive path, not the simulator command set. It must keep the `RESET WAF-FN SCHEMA` confirmation and runtime/fingerprint/prefix guards before any SQL runner call.
