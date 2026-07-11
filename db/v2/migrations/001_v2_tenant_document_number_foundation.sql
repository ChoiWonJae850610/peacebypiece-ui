-- WAFL v2 alpha.21 additive migration draft.
-- EXECUTION IS PROHIBITED IN ALPHA.21. Do not run this file against any database.
-- Future execution requires an explicitly approved dev/test runner setting both gate values below.
-- Production execution, manual Neon SQL Editor execution, backfill, seed, and destructive cleanup are forbidden.

BEGIN;

DO $draft_gate$
BEGIN
  IF current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.21-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 alpha.21 SQL is a non-executed draft; approved dev/test gate is missing';
  END IF;
END
$draft_gate$;

CREATE OR REPLACE FUNCTION wafl_v2_assert_migration_draft_gate()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  IF current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.21-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration execution requires a separately approved dev/test runner';
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION wafl_v2_request_company_id()
RETURNS text
LANGUAGE sql
STABLE
AS $function$
  SELECT nullif(current_setting('wafl.company_id', true), '')
$function$;

CREATE OR REPLACE FUNCTION wafl_v2_privileged_scope_ready(p_company_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT
    current_setting('wafl.access_mode', true) = 'privileged_system'
    AND nullif(current_setting('wafl.target_company_id', true), '') = p_company_id
    AND nullif(current_setting('wafl.system_actor_id', true), '') IS NOT NULL
    AND nullif(current_setting('wafl.privileged_reason', true), '') IS NOT NULL
    AND nullif(current_setting('wafl.correlation_id', true), '') IS NOT NULL
$function$;

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS company_code varchar(16),
  ADD COLUMN IF NOT EXISTS business_timezone text NOT NULL DEFAULT 'Asia/Seoul',
  ADD COLUMN IF NOT EXISTS document_number_prefix varchar(16);

CREATE UNIQUE INDEX IF NOT EXISTS company_settings_company_code_unique_idx
  ON company_settings (upper(company_code))
  WHERE company_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS document_number_sequences (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  business_date date NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, business_date),
  CONSTRAINT document_number_sequences_non_negative_check CHECK (last_sequence >= 0)
);

CREATE OR REPLACE FUNCTION allocate_work_order_document_sequence(
  p_company_id text,
  p_business_date date
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
DECLARE
  allocated_sequence integer;
BEGIN
  IF NOT (
    p_company_id = wafl_v2_request_company_id()
    OR wafl_v2_privileged_scope_ready(p_company_id)
  ) THEN
    RAISE EXCEPTION 'tenant scope does not permit document sequence allocation';
  END IF;

  INSERT INTO document_number_sequences (company_id, business_date, last_sequence)
  VALUES (p_company_id, p_business_date, 1)
  ON CONFLICT (company_id, business_date)
  DO UPDATE SET
    last_sequence = document_number_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO allocated_sequence;

  RETURN allocated_sequence;
END
$function$;

ALTER TABLE document_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_number_sequences FORCE ROW LEVEL SECURITY;

CREATE POLICY document_number_sequences_tenant_access
  ON document_number_sequences
  FOR ALL
  USING (company_id = wafl_v2_request_company_id())
  WITH CHECK (company_id = wafl_v2_request_company_id());

CREATE POLICY document_number_sequences_privileged_system_access
  ON document_number_sequences
  FOR ALL
  USING (wafl_v2_privileged_scope_ready(company_id))
  WITH CHECK (wafl_v2_privileged_scope_ready(company_id));

COMMIT;
