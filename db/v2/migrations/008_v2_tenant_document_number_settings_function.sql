-- WAFL v2 alpha.27a additive migration draft.
-- EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.27A DEV/TEST GATE.
-- Production execution, manual SQL Editor execution, data mutation, and direct company_settings grants are forbidden.

BEGIN;

DO $alpha27a_gate$
BEGIN
  IF current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.27a-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 008 requires the approved alpha.27a dev/test runner';
  END IF;
END
$alpha27a_gate$;

CREATE OR REPLACE FUNCTION public.wafl_v2_document_number_settings()
RETURNS TABLE (
  document_code varchar(16),
  business_timezone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
  SELECT
    COALESCE(NULLIF(pg_catalog.btrim(settings.document_number_prefix), ''), NULLIF(pg_catalog.btrim(settings.company_code), ''))::varchar(16),
    COALESCE(NULLIF(pg_catalog.btrim(settings.business_timezone), ''), 'Asia/Seoul')::text
  FROM public.company_settings AS settings
  WHERE pg_catalog.current_setting('wafl.access_mode', true) = 'tenant_member'
    AND settings.company_id = nullif(pg_catalog.current_setting('wafl.company_id', true), '')
    AND EXISTS (
      SELECT 1
      FROM public.company_members AS member
      WHERE member.company_id = settings.company_id
        AND member.id = nullif(pg_catalog.current_setting('wafl.company_member_id', true), '')
        AND member.status = 'approved'
    )
  LIMIT 1
$function$;

DO $function_owner_contract$
DECLARE
  function_owner text;
BEGIN
  SELECT pg_catalog.pg_get_userbyid(proc.proowner)
  INTO function_owner
  FROM pg_catalog.pg_proc AS proc
  JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = proc.pronamespace
  WHERE namespace.nspname = 'public'
    AND proc.proname = 'wafl_v2_document_number_settings'
    AND proc.pronargs = 0;

  IF function_owner IS DISTINCT FROM current_user THEN
    RAISE EXCEPTION 'migration executor must own wafl_v2_document_number_settings';
  END IF;
END
$function_owner_contract$;

REVOKE ALL ON FUNCTION public.wafl_v2_document_number_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wafl_v2_document_number_settings() TO wafl_v2_tenant_runtime;

COMMIT;
