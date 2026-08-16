-- WAFL v2 alpha.64 additive dev/test migration.
-- Adds canonical major-category scope to reusable company Spec Items.
-- Existing unscoped Spec Items remain intact as bounded legacy-compatible rows.

BEGIN;

DO $alpha64_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.64-category-spec-items-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 018 requires the approved alpha.64 dev/test runner';
  END IF;
END
$alpha64_gate$;

ALTER TABLE public.company_work_order_structure_options
  ADD COLUMN category_code text;

ALTER TABLE public.company_work_order_structure_options
  ADD CONSTRAINT company_work_order_structure_options_category_scope_check CHECK (
    (option_kind IN ('size', 'color') AND category_code IS NULL)
    OR (option_kind = 'spec_item' AND (category_code IS NULL OR category_code IN ('T', 'B', 'O', 'D', 'S', 'X')))
  ),
  DROP CONSTRAINT company_work_order_structure_options_company_kind_name_unique;

CREATE UNIQUE INDEX company_work_order_structure_options_company_kind_category_name_unique
  ON public.company_work_order_structure_options (
    company_id,
    option_kind,
    COALESCE(category_code, ''),
    normalized_name
  );

CREATE INDEX company_work_order_structure_options_spec_category_active_idx
  ON public.company_work_order_structure_options (company_id, category_code, display_name, id)
  WHERE option_kind = 'spec_item' AND is_active;

COMMIT;
