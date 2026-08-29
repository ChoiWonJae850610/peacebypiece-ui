-- WAFL v2 alpha.70 additive migration.
-- Approved for the canonical development/test target only. Production execution is forbidden.

BEGIN;

DO $alpha70_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.70-image-output-include-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 021 requires the approved alpha.70 dev/test runner';
  END IF;
END
$alpha70_gate$;

ALTER TABLE work_order_revision_images
  ADD COLUMN output_include boolean NOT NULL DEFAULT false;

COMMIT;
