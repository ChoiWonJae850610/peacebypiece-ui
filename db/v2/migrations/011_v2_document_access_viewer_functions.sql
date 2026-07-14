-- WAFL v2 alpha.39 additive migration.
-- EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.39 DEV/TEST GATE.
-- Production execution, manual SQL Editor execution, data mutation outside these functions,
-- table/column/index changes, and dynamic SQL are forbidden.

BEGIN;

DO $alpha39_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.39-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 011 requires the approved alpha.39 dev/test runner';
  END IF;
END
$alpha39_gate$;

CREATE OR REPLACE FUNCTION public.wafl_v2_redeem_document_access_token(
  p_token_hash char(64),
  p_correlation_id text
)
RETURNS TABLE (
  token_id uuid,
  company_id text,
  generated_document_id uuid,
  display_document_number varchar(96),
  document_type text,
  expires_at timestamptz,
  access_count bigint,
  first_access boolean,
  storage_object_key text,
  file_size_bytes bigint,
  content_sha256 char(64)
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  redeemed record;
BEGIN
  IF p_token_hash IS NULL
     OR p_token_hash !~ '^[0-9a-f]{64}$'
     OR p_correlation_id IS NULL
     OR pg_catalog.length(pg_catalog.btrim(p_correlation_id)) NOT BETWEEN 1 AND 128 THEN
    RETURN;
  END IF;

  UPDATE public.document_access_tokens AS token
  SET access_count = token.access_count + 1,
      last_accessed_at = pg_catalog.now()
  FROM public.generated_documents AS document
  WHERE token.token_hash = p_token_hash
    AND token.revoked_at IS NULL
    AND token.expires_at > pg_catalog.now()
    AND document.company_id = token.company_id
    AND document.id = token.generated_document_id
    AND document.status = 'generated'
    AND document.revoked_at IS NULL
    AND document.deleted_at IS NULL
    AND document.storage_object_key IS NOT NULL
    AND document.file_size_bytes IS NOT NULL
    AND document.content_sha256 IS NOT NULL
  RETURNING
    token.id,
    token.company_id,
    token.generated_document_id,
    document.display_document_number,
    document.document_type,
    token.expires_at,
    token.access_count,
    document.storage_object_key,
    document.file_size_bytes,
    document.content_sha256
  INTO redeemed;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF redeemed.access_count = 1 THEN
    INSERT INTO public.domain_events (
      company_id,
      entity_type,
      entity_id,
      command_code,
      correlation_id,
      change_summary,
      metadata,
      schema_version
    ) VALUES (
      redeemed.company_id,
      'document_access_token',
      redeemed.id::text,
      'pdf.share_viewed',
      p_correlation_id,
      'Controlled document link viewed for the first time.',
      pg_catalog.jsonb_build_object(
        'generatedDocumentId', redeemed.generated_document_id,
        'accessTokenId', redeemed.id,
        'displayDocumentNumber', redeemed.display_document_number,
        'accessCount', redeemed.access_count,
        'channel', 'controlled_link'
      ),
      1
    );
  END IF;

  RETURN QUERY
  SELECT
    redeemed.id::uuid,
    redeemed.company_id::text,
    redeemed.generated_document_id::uuid,
    redeemed.display_document_number::varchar(96),
    redeemed.document_type::text,
    redeemed.expires_at::timestamptz,
    redeemed.access_count::bigint,
    (redeemed.access_count = 1)::boolean,
    redeemed.storage_object_key::text,
    redeemed.file_size_bytes::bigint,
    redeemed.content_sha256::char(64);
END
$function$;

CREATE OR REPLACE FUNCTION public.wafl_v2_read_document_access_session(
  p_token_id uuid,
  p_generated_document_id uuid
)
RETURNS TABLE (
  token_id uuid,
  company_id text,
  generated_document_id uuid,
  display_document_number varchar(96),
  document_type text,
  expires_at timestamptz,
  access_count bigint,
  storage_object_key text,
  file_size_bytes bigint,
  content_sha256 char(64)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    token.id,
    token.company_id,
    token.generated_document_id,
    document.display_document_number,
    document.document_type,
    token.expires_at,
    token.access_count,
    document.storage_object_key,
    document.file_size_bytes,
    document.content_sha256
  FROM public.document_access_tokens AS token
  JOIN public.generated_documents AS document
    ON document.company_id = token.company_id
   AND document.id = token.generated_document_id
  WHERE token.id = p_token_id
    AND token.generated_document_id = p_generated_document_id
    AND token.revoked_at IS NULL
    AND token.expires_at > pg_catalog.now()
    AND document.status = 'generated'
    AND document.revoked_at IS NULL
    AND document.deleted_at IS NULL
    AND document.storage_object_key IS NOT NULL
    AND document.file_size_bytes IS NOT NULL
    AND document.content_sha256 IS NOT NULL
  LIMIT 1
$function$;

DO $function_owner_contract$
DECLARE
  function_count integer;
  unsafe_owner_count integer;
BEGIN
  SELECT pg_catalog.count(*)::integer,
         pg_catalog.count(*) FILTER (WHERE owner_role.rolbypassrls IS NOT TRUE)::integer
  INTO function_count, unsafe_owner_count
  FROM pg_catalog.pg_proc AS proc
  JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = proc.pronamespace
  JOIN pg_catalog.pg_roles AS owner_role ON owner_role.oid = proc.proowner
  WHERE namespace.nspname = 'public'
    AND proc.proname IN (
      'wafl_v2_redeem_document_access_token',
      'wafl_v2_read_document_access_session'
    )
    AND proc.pronargs = 2
    AND pg_catalog.pg_get_userbyid(proc.proowner) = current_user;

  IF function_count <> 2 OR unsafe_owner_count <> 0 THEN
    RAISE EXCEPTION 'alpha.39 viewer functions require the migration owner with BYPASSRLS';
  END IF;
END
$function_owner_contract$;

REVOKE ALL ON FUNCTION public.wafl_v2_redeem_document_access_token(char(64), text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wafl_v2_read_document_access_session(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.wafl_v2_redeem_document_access_token(char(64), text)
  TO wafl_v2_tenant_runtime;
GRANT EXECUTE ON FUNCTION public.wafl_v2_read_document_access_session(uuid, uuid)
  TO wafl_v2_tenant_runtime;

COMMENT ON FUNCTION public.wafl_v2_redeem_document_access_token(char(64), text)
  IS 'Redeems one hash-only opaque controlled-link token and records only the first successful view event.';
COMMENT ON FUNCTION public.wafl_v2_read_document_access_session(uuid, uuid)
  IS 'Revalidates an opaque viewer session without incrementing access_count.';

COMMIT;
