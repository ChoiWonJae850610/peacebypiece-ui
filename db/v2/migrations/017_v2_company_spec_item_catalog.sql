-- WAFL v2 alpha.64 additive dev/test migration.
-- Extends the canonical same-company reusable WorkOrder structure catalog with spec items.
-- WorkOrder finished-spec rows remain immutable-by-issue snapshots and keep no catalog FK.

BEGIN;

DO $alpha64_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.64-spec-catalog-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 017 requires the approved alpha.64 dev/test runner';
  END IF;
END
$alpha64_gate$;

ALTER TABLE public.company_work_order_structure_options
  DROP CONSTRAINT company_work_order_structure_options_kind_check,
  DROP CONSTRAINT company_work_order_structure_options_hex_check;

ALTER TABLE public.company_work_order_structure_options
  ADD CONSTRAINT company_work_order_structure_options_kind_check
    CHECK (option_kind IN ('size', 'color', 'spec_item')),
  ADD CONSTRAINT company_work_order_structure_options_hex_check CHECK (
    (option_kind IN ('size', 'spec_item') AND hex_value IS NULL)
    OR (option_kind = 'color' AND (hex_value IS NULL OR hex_value ~ '^#[0-9A-F]{6}$'))
  );

COMMIT;
