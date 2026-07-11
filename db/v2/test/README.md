# v2 DB Contract and Performance Test Workspace

## Responsibility

This folder is reserved for v2 schema contracts, migration validation, post-apply smoke tests, tenant/RLS isolation, cursor pagination, query count, payload budget, and performance tests.

## Allowed files

- Static contract tests, read-only verification queries, expected-result manifests, and guarded dev/test benchmark definitions.

## Forbidden work

- DB test execution in alpha.20.
- Unguarded destructive tests, production mutation, real customer fixtures, or tests that conceal mutation behind validation.

## Test classes

- Static schema and migration contract tests.
- Read-only compatibility and post-apply smoke tests.
- Tenant isolation and privileged system-path tests.
- Cursor stability and duplicate/missing-row tests.
- 500/5,000-row query and payload benchmarks.
- Destructive reset/purge tests in a separately guarded dev/test-only class.

## Current stage

- alpha.20: repository-level type/static API contract tests only; no DB test files.
- alpha.21: `tests/workorder-v2-migration-schema-contract.mjs` validates migration/schema safety without a DB connection.
- alpha.22: tenant/privileged RLS, cursor, concurrency, idempotency, immutable revision, readiness, document sequence, payload, and performance evidence PASS.
- production use: destructive tests forbidden; read-only checks require an explicit production gate.
- next version: alpha.23 adds the first bounded list Read API vertical slice against this evidence baseline.

Legacy DB tests remain under `db/test/` and are not moved.
