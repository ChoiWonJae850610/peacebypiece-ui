-- WAFL v2 alpha.30 additive migration draft.
-- EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.30 DEV/TEST GATE.
-- Production execution, backfill, destructive SQL, and manual SQL Editor execution are forbidden.

BEGIN;

DO $alpha30_gate$
BEGIN
  IF current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.30-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 009 requires the approved alpha.30 dev/test runner';
  END IF;
END
$alpha30_gate$;

ALTER TABLE public.work_order_material_lines
  ADD COLUMN IF NOT EXISTS usage_area text,
  ADD CONSTRAINT work_order_material_lines_usage_area_length_check
    CHECK (usage_area IS NULL OR char_length(usage_area) <= 1000) NOT VALID;

ALTER TABLE public.work_order_processes
  ADD COLUMN IF NOT EXISTS application_area text,
  ADD COLUMN IF NOT EXISTS application_color_target text,
  ADD CONSTRAINT work_order_processes_application_area_length_check
    CHECK (application_area IS NULL OR char_length(application_area) <= 1000) NOT VALID,
  ADD CONSTRAINT work_order_processes_application_color_target_length_check
    CHECK (application_color_target IS NULL OR char_length(application_color_target) <= 1000) NOT VALID;

ALTER TABLE public.work_order_revisions
  ADD COLUMN IF NOT EXISTS factory_delivery_memo text,
  ADD CONSTRAINT work_order_revisions_factory_delivery_memo_length_check
    CHECK (factory_delivery_memo IS NULL OR char_length(factory_delivery_memo) <= 5000) NOT VALID;

COMMENT ON COLUMN public.work_order_material_lines.usage_area IS 'Free-text factory-facing material usage area; revision-scoped.';
COMMENT ON COLUMN public.work_order_processes.application_area IS 'Free-text process application area; revision-scoped.';
COMMENT ON COLUMN public.work_order_processes.application_color_target IS 'Free-text process color or target scope; revision-scoped.';
COMMENT ON COLUMN public.work_order_revisions.factory_delivery_memo IS 'Factory delivery memo frozen with the issued revision.';

COMMIT;
