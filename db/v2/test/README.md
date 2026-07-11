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
- alpha.21: migration/schema static validation.
- alpha.22: approved dev/test DB tests and performance evidence.
- production use: destructive tests forbidden; read-only checks require an explicit production gate.
- next version: alpha.21 adds static migration/schema contracts without a DB connection.

Legacy DB tests remain under `db/test/` and are not moved.
