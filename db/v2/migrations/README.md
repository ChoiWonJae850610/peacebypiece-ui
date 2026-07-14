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
- alpha.22: approved dev/test apply PASS; ledger 6/6, v1 baseline unchanged, RLS/reconciliation and 500/5,000/multi-tenant evidence PASS.
- alpha.23: approved dev/test additive index `007` apply PASS; ledger 7/7.
- alpha.27a: approved dev/test migration `008` apply PASS; ledger 8/8. The tenant-safe document-number settings function/ACL and Company A/B/H synthetic settings isolation are verified; production remains untouched.
- alpha.30: approved dev/test migration `009` apply PASS; ledger 9/9. Four nullable factory-instruction fields and four deferred length checks were added without backfill or business-row changes.
- alpha.38: approved dev/test migration `010` apply PASS; ledger 10/10. `work_order_command_receipts.result_generated_document_id` is nullable native `uuid` with a company-scoped FK to `generated_documents`; existing receipts remain null and production is untouched.
- alpha.39 preparation: guarded additive migration `011` defines two fixed-search-path SECURITY DEFINER viewer functions and EXECUTE ACLs only. Source/static checks are ready; apply is not authorized by this document and ledger remains 10/10 until explicit approval.
- production use: forbidden until the production migration gate is explicitly approved.
- next version: alpha.23 consumes the measured schema through a bounded Read API only; no migration rerun is implied.

The existing `db/migrations/` path remains the legacy/current executable baseline. Its files are not moved or rewritten for v2.

## Alpha.21 ordered drafts

1. `001_v2_tenant_document_number_foundation.sql`
2. `002_v2_work_orders_revisions.sql`
3. `003_v2_revision_content.sql`
4. `004_v2_assets_revision_linkage.sql`
5. `005_v2_documents_access_events.sql`
6. `006_v2_deferred_constraints_indexes.sql`
7. `007_v2_work_order_list_material_lookup_index.sql`
8. `008_v2_tenant_document_number_settings_function.sql`
9. `009_v2_workorder_factory_instruction_fields.sql`
10. `010_v2_generated_document_receipt_link.sql`
11. `011_v2_document_access_viewer_functions.sql`

The order is a static contract. No file is applied, validated, backfilled, seeded, or benchmarked in alpha.21.
