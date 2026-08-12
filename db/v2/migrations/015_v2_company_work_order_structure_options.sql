-- WAFL v2 alpha.62 additive dev/test migration.
-- Reusable company size/color choices; WorkOrder rows remain historical snapshots.
-- Production execution, backfill, and destructive SQL are forbidden.

BEGIN;

DO $alpha62_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.62-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 015 requires the approved alpha.62 dev/test runner';
  END IF;
END
$alpha62_gate$;

CREATE TABLE public.company_work_order_structure_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  option_kind text NOT NULL,
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  hex_value text,
  is_active boolean NOT NULL DEFAULT true,
  created_by_member_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_work_order_structure_options_kind_check CHECK (option_kind IN ('size', 'color')),
  CONSTRAINT company_work_order_structure_options_name_check CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  CONSTRAINT company_work_order_structure_options_normalized_name_check CHECK (length(normalized_name) BETWEEN 1 AND 80 AND normalized_name = lower(trim(normalized_name))),
  CONSTRAINT company_work_order_structure_options_hex_check CHECK (
    (option_kind = 'size' AND hex_value IS NULL)
    OR (option_kind = 'color' AND (hex_value IS NULL OR hex_value ~ '^#[0-9A-F]{6}$'))
  ),
  CONSTRAINT company_work_order_structure_options_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT company_work_order_structure_options_company_kind_name_unique UNIQUE (company_id, option_kind, normalized_name)
);

CREATE INDEX company_work_order_structure_options_active_idx
  ON public.company_work_order_structure_options (company_id, option_kind, display_name, id)
  WHERE is_active;

ALTER TABLE public.company_work_order_structure_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_work_order_structure_options FORCE ROW LEVEL SECURITY;

CREATE POLICY company_work_order_structure_options_tenant_access
  ON public.company_work_order_structure_options
  FOR ALL
  USING (company_id = public.wafl_v2_request_company_id())
  WITH CHECK (company_id = public.wafl_v2_request_company_id());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.company_work_order_structure_options
  TO wafl_v2_tenant_runtime;

COMMIT;
