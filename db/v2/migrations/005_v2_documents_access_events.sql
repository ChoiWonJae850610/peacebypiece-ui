-- WAFL v2 alpha.21 additive migration draft.
-- EXECUTION IS PROHIBITED IN ALPHA.21. Do not run this file against any database.
-- Requires the separately approved dev/test gate and migrations 001-004. Production execution is forbidden.

BEGIN;

SELECT wafl_v2_assert_migration_draft_gate();

CREATE TABLE IF NOT EXISTS generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
  work_order_revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  document_type text NOT NULL,
  generation_no integer NOT NULL DEFAULT 1,
  display_document_number varchar(96) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  storage_object_key text,
  file_size_bytes bigint,
  content_sha256 char(64),
  renderer_version text NOT NULL,
  dto_schema_version integer NOT NULL,
  snapshot jsonb NOT NULL,
  failure_code text,
  generated_at timestamptz,
  revoked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT generated_documents_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT generated_documents_generation_unique UNIQUE (
    work_order_revision_id, document_type, generation_no
  ),
  CONSTRAINT generated_documents_status_check CHECK (
    status IN ('pending', 'generated', 'failed', 'revoked', 'deleted')
  ),
  CONSTRAINT generated_documents_generation_no_check CHECK (generation_no >= 1),
  CONSTRAINT generated_documents_schema_version_check CHECK (dto_schema_version >= 1),
  CONSTRAINT generated_documents_size_check CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CONSTRAINT generated_documents_hash_check CHECK (
    content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT generated_documents_generated_state_check CHECK (
    status <> 'generated'
    OR (
      storage_object_key IS NOT NULL
      AND file_size_bytes IS NOT NULL
      AND content_sha256 IS NOT NULL
      AND generated_at IS NOT NULL
    )
  )
);

CREATE TABLE IF NOT EXISTS document_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  generated_document_id uuid NOT NULL REFERENCES generated_documents(id) ON DELETE RESTRICT,
  token_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  rotated_from_token_id uuid REFERENCES document_access_tokens(id) ON DELETE RESTRICT,
  last_accessed_at timestamptz,
  access_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_access_tokens_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT document_access_tokens_hash_unique UNIQUE (token_hash),
  CONSTRAINT document_access_tokens_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT document_access_tokens_access_count_check CHECK (access_count >= 0),
  CONSTRAINT document_access_tokens_expiry_check CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  command_code text NOT NULL,
  actor_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  system_actor_id text,
  privileged_reason text,
  correlation_id text NOT NULL,
  change_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_version integer NOT NULL DEFAULT 1,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT domain_events_schema_version_check CHECK (schema_version >= 1),
  CONSTRAINT domain_events_privileged_audit_check CHECK (
    system_actor_id IS NULL
    OR (privileged_reason IS NOT NULL AND length(trim(privileged_reason)) > 0)
  )
);

CREATE OR REPLACE FUNCTION wafl_v2_guard_immutable_generated_document()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'generated document rows use lifecycle status and are not physically deleted here';
  END IF;

  IF OLD.status IN ('generated', 'revoked', 'deleted')
     AND (to_jsonb(NEW) - ARRAY['status', 'revoked_at', 'deleted_at', 'updated_at'])
         <> (to_jsonb(OLD) - ARRAY['status', 'revoked_at', 'deleted_at', 'updated_at']) THEN
    RAISE EXCEPTION 'generated document snapshot and file identity are immutable';
  END IF;

  RETURN NEW;
END
$function$;

CREATE TRIGGER generated_documents_immutable_guard
  BEFORE UPDATE OR DELETE ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION wafl_v2_guard_immutable_generated_document();

CREATE OR REPLACE FUNCTION wafl_v2_guard_append_only_domain_event()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'domain events are append-only';
END
$function$;

CREATE TRIGGER domain_events_append_only_guard
  BEFORE UPDATE OR DELETE ON domain_events
  FOR EACH ROW
  EXECUTE FUNCTION wafl_v2_guard_append_only_domain_event();

DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'generated_documents',
    'document_access_tokens'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (company_id = wafl_v2_request_company_id()) WITH CHECK (company_id = wafl_v2_request_company_id())',
      table_name || '_tenant_access',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (wafl_v2_privileged_scope_ready(company_id)) WITH CHECK (wafl_v2_privileged_scope_ready(company_id))',
      table_name || '_privileged_system_access',
      table_name
    );
  END LOOP;
END
$rls$;

ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_events FORCE ROW LEVEL SECURITY;

CREATE POLICY domain_events_tenant_select
  ON domain_events
  FOR SELECT
  USING (company_id = wafl_v2_request_company_id());

CREATE POLICY domain_events_tenant_insert
  ON domain_events
  FOR INSERT
  WITH CHECK (company_id = wafl_v2_request_company_id() AND system_actor_id IS NULL);

CREATE POLICY domain_events_privileged_system_select
  ON domain_events
  FOR SELECT
  USING (wafl_v2_privileged_scope_ready(company_id));

CREATE POLICY domain_events_privileged_system_insert
  ON domain_events
  FOR INSERT
  WITH CHECK (
    wafl_v2_privileged_scope_ready(company_id)
    AND system_actor_id = current_setting('wafl.system_actor_id', true)
    AND privileged_reason = current_setting('wafl.privileged_reason', true)
    AND correlation_id = current_setting('wafl.correlation_id', true)
  );

COMMIT;
