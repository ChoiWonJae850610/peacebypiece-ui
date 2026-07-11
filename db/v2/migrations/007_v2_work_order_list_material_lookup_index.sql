-- WAFL v2 alpha.23 additive performance migration.
-- EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.23 DEV/TEST GATE.
-- Apply only through the canonical runner to the approved dev/test fingerprint.
-- Production execution, seed/reset/cleanup, destructive SQL, and automatic retry are forbidden.

BEGIN;

SELECT wafl_v2_assert_migration_draft_gate();

CREATE INDEX IF NOT EXISTS work_order_material_lines_company_revision_cover_idx
  ON work_order_material_lines (company_id, revision_id)
  INCLUDE (material_type, status);

COMMIT;
