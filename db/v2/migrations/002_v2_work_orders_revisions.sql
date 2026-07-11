-- WAFL v2 alpha.21 additive migration draft.
-- EXECUTION IS PROHIBITED IN ALPHA.21. Do not run this file against any database.
-- Requires the separately approved dev/test gate and migration 001. Production execution is forbidden.

BEGIN;

SELECT wafl_v2_assert_migration_draft_gate();

CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  legacy_source_id text,
  product_name text NOT NULL,
  product_type_code text,
  season_code varchar(16),
  item_code varchar(24),
  status text NOT NULL DEFAULT 'draft',
  due_date date,
  total_quantity integer NOT NULL DEFAULT 0,
  document_number_base varchar(80),
  document_business_date date,
  document_sequence integer,
  current_revision_id uuid,
  representative_image_id uuid,
  created_by_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  assignee_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  entity_version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  purge_after_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_orders_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_orders_legacy_source_unique UNIQUE (company_id, legacy_source_id),
  CONSTRAINT work_orders_document_number_unique UNIQUE (company_id, document_number_base),
  CONSTRAINT work_orders_status_check CHECK (
    status IN ('draft', 'ready_to_issue', 'issued', 'revised', 'cancelled', 'completed')
  ),
  CONSTRAINT work_orders_total_quantity_check CHECK (total_quantity >= 0),
  CONSTRAINT work_orders_entity_version_check CHECK (entity_version >= 1),
  CONSTRAINT work_orders_document_sequence_check CHECK (document_sequence IS NULL OR document_sequence >= 1),
  CONSTRAINT work_orders_purge_window_check CHECK (
    purge_after_at IS NULL OR deleted_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS work_order_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
  revision_no integer NOT NULL,
  revision_status text NOT NULL DEFAULT 'draft',
  revision_reason text,
  source_revision_id uuid REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  company_code_snapshot varchar(16),
  season_code_snapshot varchar(16),
  item_code_snapshot varchar(24),
  product_name_snapshot text NOT NULL,
  product_type_code_snapshot text,
  due_date_snapshot date,
  total_quantity_snapshot integer NOT NULL DEFAULT 0,
  unit_price numeric(14, 2) NOT NULL DEFAULT 0,
  fabric_total numeric(14, 2) NOT NULL DEFAULT 0,
  accessory_total numeric(14, 2) NOT NULL DEFAULT 0,
  process_total numeric(14, 2) NOT NULL DEFAULT 0,
  estimated_total numeric(14, 2) NOT NULL DEFAULT 0,
  quantity_matrix_note text,
  memo text,
  author_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  finalized_by_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  finalized_at timestamptz,
  entity_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_revisions_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_revisions_number_unique UNIQUE (work_order_id, revision_no),
  CONSTRAINT work_order_revisions_revision_no_check CHECK (revision_no >= 0),
  CONSTRAINT work_order_revisions_status_check CHECK (
    revision_status IN ('draft', 'finalized', 'superseded', 'cancelled')
  ),
  CONSTRAINT work_order_revisions_quantity_check CHECK (total_quantity_snapshot >= 0),
  CONSTRAINT work_order_revisions_amount_check CHECK (
    unit_price >= 0 AND fabric_total >= 0 AND accessory_total >= 0
    AND process_total >= 0 AND estimated_total >= 0
  ),
  CONSTRAINT work_order_revisions_finalize_check CHECK (
    (revision_status IN ('finalized', 'superseded') AND finalized_at IS NOT NULL)
    OR revision_status IN ('draft', 'cancelled')
  ),
  CONSTRAINT work_order_revisions_entity_version_check CHECK (entity_version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS work_order_revisions_single_draft_idx
  ON work_order_revisions (work_order_id)
  WHERE revision_status = 'draft';

CREATE TABLE IF NOT EXISTS work_order_command_receipts (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  command_code text NOT NULL,
  idempotency_key varchar(128) NOT NULL,
  request_sha256 char(64) NOT NULL,
  work_order_id uuid REFERENCES work_orders(id) ON DELETE RESTRICT,
  result_revision_id uuid REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  result_entity_version integer,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (company_id, command_code, idempotency_key),
  CONSTRAINT work_order_command_receipts_hash_check CHECK (request_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT work_order_command_receipts_result_version_check CHECK (
    result_entity_version IS NULL OR result_entity_version >= 1
  )
);

CREATE OR REPLACE FUNCTION wafl_v2_guard_immutable_work_order_revision()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.revision_status <> 'draft' THEN
      RAISE EXCEPTION 'finalized, superseded, and cancelled revisions are immutable';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.revision_status IN ('finalized', 'superseded', 'cancelled') THEN
    IF OLD.revision_status = 'finalized'
       AND NEW.revision_status = 'superseded'
       AND (to_jsonb(NEW) - ARRAY['revision_status', 'updated_at'])
           = (to_jsonb(OLD) - ARRAY['revision_status', 'updated_at']) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'immutable revision content cannot be updated';
  END IF;

  RETURN NEW;
END
$function$;

CREATE TRIGGER work_order_revisions_immutable_guard
  BEFORE UPDATE OR DELETE ON work_order_revisions
  FOR EACH ROW
  EXECUTE FUNCTION wafl_v2_guard_immutable_work_order_revision();

DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'work_orders',
    'work_order_revisions',
    'work_order_command_receipts'
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

COMMIT;
