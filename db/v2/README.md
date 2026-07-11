# WAFL v2 DB Architecture Workspace

Status: `2.0.0-alpha.22` approved dev/test apply and performance-evidence workspace. Production use remains forbidden.

## Responsibility

This directory is the neutral workspace for the WAFL v2 relational schema, additive migrations, read-only audits, deterministic dev/test seeds, and schema/performance tests.

The existing paths remain the legacy v1 baseline and are not moved:

- `db/schema/`
- `db/migrations/`
- `db/audits/`
- `db/seed/`
- `db/test/`

`db/v2` does not make the existing paths obsolete. It prevents an unfinished v2 design from being mixed into the current executable DB baseline.

## Current stage

- alpha.20: README boundaries and type/API contracts only.
- alpha.21: six ordered, execution-guarded additive migration drafts and static schema contracts; no DB connection or apply.
- alpha.22: approved dev/test migrations 001-006 applied with ledger 6/6; 10,900 deterministic WorkOrders and RLS/cursor/concurrency/performance evidence PASS.
- production use: forbidden until all migration, RLS, rollback, performance, and owner approval gates pass.

## Allowed files

- Boundary README files.
- Reviewed migration drafts only under `migrations/` in alpha.21.
- Schema, audit, seed, and DB-runtime test artifacts only in the later version and folder assigned below.

## Forbidden work

- Do not place SQL outside `migrations/`; do not add `full_reset.sql`, seed SQL, DB connection scripts, or destructive reset scripts in alpha.21.
- Do not execute SQL through Neon SQL Editor as the normal operating procedure.
- Future applies use the approved migration runner and PowerShell safety guards.
- Direct manual SQL is exceptional recovery only and needs explicit approval.
- Production DB, production R2, and business data mutation are forbidden.
- Next version: alpha.23 may implement a bounded list Read API vertical slice. Production apply, write API, mobile runtime integration, and constraint validation remain separately gated.

## Child folders

- [`schema/README.md`](schema/README.md): future integrated canonical schema.
- [`migrations/README.md`](migrations/README.md): ordered additive migration drafts.
- [`audits/README.md`](audits/README.md): read-only pre/post apply reconciliation.
- [`seed/README.md`](seed/README.md): deterministic dev/test performance fixtures.
- [`test/README.md`](test/README.md): schema, migration, tenant, pagination, and performance contracts.

Canonical design references:

- `docs/project/app-v2/13-core-domain-schema-v2.md`
- `docs/project/app-v2/14-v2-schema-migration-and-performance-plan.md`
- `docs/project/app-v2/15-v2-source-db-boundary-and-release-policy.md`
- `docs/project/app-v2/19-v2-dev-test-migration-and-performance-evidence.md`
