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
- alpha.39 completed: approved dev/test migration `011` applied once; ledger 11/11 and existing rows were unchanged.
- alpha.42 preparation: guarded additive migration `012` defines token purpose, its CHECK, and the one-embedded-token-per-document partial unique index. Apply is not authorized by this document; ledger remains 11/11 until explicit approval.
- alpha.62 preparation: guarded additive migration `014` adds versioned system/company size-spec templates and their size/POM/value rows. It has no seed, backfill, or destructive SQL; approved dev/test apply and post-apply audit are required before runtime use.
- alpha.62 Maker authoring continuation: guarded additive migration `015` adds tenant-owned reusable company size/color choices with normalized uniqueness and active/inactive history safety. WorkOrder size/color rows remain independent historical snapshots. It has no seed, backfill, or production apply authority.
- alpha.64 preparation: guarded additive migration `016` adds issuance-time material supplier-name snapshots and permits only managed `embedded_qr` tokens to use a nullable expiry. Manual-share expiry remains mandatory. Viewer SECURITY DEFINER predicates accept a null expiry without weakening revoke or generated-document lifecycle checks. Apply is dev/test-only and separately audited.
- alpha.64 spec-catalog preparation: guarded migration `017` extends the existing same-company reusable size/color option catalog with `spec_item`. WorkOrder and saved-template POM rows remain independent snapshots; no catalog foreign key or backfill is introduced. Apply is dev/test-only and separately audited.
- alpha.64 category-aware Spec Item remediation: guarded migration `018` adds nullable major-category scope to company `spec_item` options, preserves existing unscoped rows without backfill, and replaces only the catalog name uniqueness owner so category-scoped names remain independent. Apply is dev/test-only and separately audited.
- alpha.66 WorkOrder identity foundation: guarded migration `019` adds independent Sample and derivation-lineage columns, tenant-safe source/root/revision references, and list/filter indexes. Existing rows remain non-Sample original round zero; apply is additive DEV/TEST-only with no production execution.
- alpha.66 Sample/Reorder invariant: guarded additive migration `020` prevents Sample from carrying direct Reorder or inherited reorder-round context while preserving Sample Rework at round zero. Apply is DEV/TEST-only after exact synthetic-fixture reconciliation; production execution remains forbidden.
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
12. `012_v2_document_access_token_purpose.sql`
13. `013_v2_material_line_archive_lifecycle.sql`
14. `014_v2_size_spec_templates.sql`
15. `015_v2_company_work_order_structure_options.sql`
16. `016_v2_r0_document_snapshot_and_managed_qr.sql`
17. `017_v2_company_spec_item_catalog.sql`
18. `018_v2_company_spec_item_category_scope.sql`
19. `019_v2_work_order_lineage_sample.sql`
20. `020_v2_sample_reorder_invariant.sql`

The order is a static contract. No file is applied, validated, backfilled, seeded, or benchmarked in alpha.21.
