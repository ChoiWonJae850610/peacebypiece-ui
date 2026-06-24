# Pending Tests — 0.24.21.10

## Automatic

- `node tests/db-schema-audit-contract.mjs`
- `node tests/unicode-encoding-contract.mjs`
- local canonical document/roadmap contracts

## Manual review

- Verify the 60-table domain classification against current runtime ownership.
- Confirm that no table is interpreted as approved for deletion.
- In 0.24.21.11, validate deployed schema/RLS drift only in an approved dev/test environment.
- Run duplicate/orphan/reconciliation SQL as dry-run before proposing any constraint.
- Obtain query-plan evidence before adding or removing indexes.

## Not executed in this patch

- DB connection or SQL execution
- migration/reset/seed/cleanup
- R2 access or mutation
- production access
