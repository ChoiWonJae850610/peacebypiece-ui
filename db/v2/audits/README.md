# v2 Read-only Audit Workspace

## Responsibility

This folder is reserved for v2 schema preflight, post-apply, residual, missing-row, orphan, tenant-scope, and reconciliation audits.

## Allowed files

- Read-only audit SQL drafts, expected-result manifests, and audit contract documentation from alpha.21 onward.

## Forbidden work

- Repair, backfill, delete, update, migration apply, or any script that opens a mutation path.
- Production connection details, secrets, raw tokens, or customer document content.

## Rules

- Read-only audit comes before mutation.
- Audit output must distinguish confirmed facts, inferred risks, and unresolved deployed-schema questions.
- Never print secrets, raw tokens, signed URLs, or customer document contents.
- Queries must not repair, backfill, delete, or update data.
- Production audit access requires separate explicit approval and read-only credentials.

## Current stage

- alpha.20: README boundary only.
- alpha.21: read-only audit SQL drafts may accompany migration drafts.
- alpha.22: approved dev/test pre/post apply audit execution.
- production use: only as a gated read-only verification step before a separately approved migration.
- next version: alpha.21 may add read-only audit drafts paired with reviewed migrations.

Legacy audits remain under `db/audits/` and are not moved.
