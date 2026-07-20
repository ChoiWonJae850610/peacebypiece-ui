-- WAFL v2 alpha.51 additive migration.
-- EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.51 DEV/TEST GATE.
-- Production execution, destructive deletion, rollback, and manual SQL Editor execution are forbidden.

BEGIN;

DO $alpha51_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.51-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 013 requires the approved alpha.51 dev/test runner';
  END IF;
END
$alpha51_gate$;

ALTER TABLE public.work_order_material_lines
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN archived_by_member_id text;

ALTER TABLE public.work_order_material_lines
  ADD CONSTRAINT work_order_material_lines_archive_metadata_check
  CHECK (
    archived_at IS NOT NULL OR archived_by_member_id IS NULL
  );

ALTER TABLE public.work_order_material_lines
  ADD CONSTRAINT work_order_material_lines_archived_by_company_fk
  FOREIGN KEY (company_id, archived_by_member_id)
  REFERENCES company_members (company_id, id)
  ON DELETE SET NULL (archived_by_member_id)
  NOT VALID;

CREATE INDEX work_order_material_lines_active_revision_type_order_idx
  ON public.work_order_material_lines (revision_id, material_type, display_order, id)
  WHERE archived_at IS NULL;

CREATE INDEX work_order_material_lines_archived_revision_type_order_idx
  ON public.work_order_material_lines (revision_id, material_type, display_order, id)
  WHERE archived_at IS NOT NULL;

COMMENT ON COLUMN public.work_order_material_lines.archived_at IS
  'Draft-only reversible material archive timestamp; NULL means active.';
COMMENT ON COLUMN public.work_order_material_lines.archived_by_member_id IS
  'Tenant member that archived the material line; cleared on restore.';

COMMIT;
