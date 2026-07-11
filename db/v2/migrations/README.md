# v2 Additive Migration Workspace

## Responsibility

This folder contains the ordered, additive, reviewed v2 migration SQL drafts introduced in alpha.21.

## Allowed files

- `001` through `006` guarded additive migration drafts and their non-mutating validation manifests.
- Migration-local documentation that records preflight, rollback, and compatibility assumptions.

## Forbidden work

- Any DB execution in alpha.21.
- Production apply, destructive cleanup, seed data, direct Neon connection scripts, or full-reset SQL.

## Required migration contract

- One bounded domain change per migration.
- Explicit preflight and compatibility assumptions.
- Read-only post-apply audit.
- Rollback or feature-flag fallback stance.
- Tenant/RLS and system-admin privileged-path review.
- No destructive cleanup mixed into additive foundation migrations.

## Current stage

- alpha.20: no SQL files.
- alpha.21: six SQL drafts and static contract validation only; no connection, apply, constraint validation, seed, or benchmark.
- alpha.22: approved dev/test apply, post-apply audit, and 500/5,000-row validation.
- production use: forbidden until the production migration gate is explicitly approved.
- next version: alpha.22 may apply the reviewed sequence to an explicitly approved dev/test branch only.

The existing `db/migrations/` path remains the legacy/current executable baseline. Its files are not moved or rewritten for v2.

## Alpha.21 ordered drafts

1. `001_v2_tenant_document_number_foundation.sql`
2. `002_v2_work_orders_revisions.sql`
3. `003_v2_revision_content.sql`
4. `004_v2_assets_revision_linkage.sql`
5. `005_v2_documents_access_events.sql`
6. `006_v2_deferred_constraints_indexes.sql`

The order is a static contract. No file is applied, validated, backfilled, seeded, or benchmarked in alpha.21.
