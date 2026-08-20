-- WAFL v2 alpha.66 additive Sample/Reorder invariant.
-- DEV/TEST APPLY ONLY. Production execution is prohibited.

BEGIN;

DO $alpha66_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.66-sample-reorder-invariant-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 020 requires the approved alpha.66 dev/test runner';
  END IF;
END
$alpha66_gate$;

DO $sample_reorder_preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM work_orders
    WHERE is_sample = true
      AND (derivation_kind = 'reorder' OR reorder_round >= 1)
  ) THEN
    RAISE EXCEPTION 'WAFL v2 migration 020 found invalid Sample/Reorder rows';
  END IF;
END
$sample_reorder_preflight$;

ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_sample_reorder_invariant_check
  CHECK (NOT is_sample OR (derivation_kind <> 'reorder' AND reorder_round = 0));

COMMIT;
