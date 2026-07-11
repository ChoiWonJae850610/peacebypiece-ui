-- WAFL v2 alpha.21 additive migration draft.
-- EXECUTION IS PROHIBITED IN ALPHA.21. Do not run this file against any database.
-- Requires the separately approved dev/test gate and migrations 001-003. Production execution is forbidden.

BEGIN;

SELECT wafl_v2_assert_migration_draft_gate();

CREATE TABLE IF NOT EXISTS work_order_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
  storage_object_key text NOT NULL,
  thumbnail_object_key text,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  content_sha256 char(64),
  title text,
  display_order integer NOT NULL DEFAULT 0,
  is_current_representative boolean NOT NULL DEFAULT false,
  created_by_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  purge_after_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_images_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_images_size_check CHECK (size_bytes >= 0),
  CONSTRAINT work_order_images_hash_check CHECK (
    content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT work_order_images_display_order_check CHECK (display_order >= 0),
  CONSTRAINT work_order_images_purge_window_check CHECK (
    purge_after_at IS NULL OR deleted_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS work_order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
  attachment_kind text NOT NULL DEFAULT 'file',
  storage_object_key text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  content_sha256 char(64),
  output_include_default boolean NOT NULL DEFAULT false,
  created_by_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  purge_after_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_attachments_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_attachments_size_check CHECK (size_bytes >= 0),
  CONSTRAINT work_order_attachments_hash_check CHECK (
    content_sha256 IS NULL OR content_sha256 ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT work_order_attachments_purge_window_check CHECK (
    purge_after_at IS NULL OR deleted_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS work_order_revision_images (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  image_id uuid NOT NULL REFERENCES work_order_images(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0,
  is_representative boolean NOT NULL DEFAULT false,
  filename_snapshot text NOT NULL,
  mime_type_snapshot text NOT NULL,
  storage_object_key_snapshot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (revision_id, image_id),
  CONSTRAINT work_order_revision_images_display_order_check CHECK (display_order >= 0)
);

CREATE TABLE IF NOT EXISTS work_order_revision_attachments (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  attachment_id uuid NOT NULL REFERENCES work_order_attachments(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0,
  output_include boolean NOT NULL DEFAULT false,
  filename_snapshot text NOT NULL,
  mime_type_snapshot text NOT NULL,
  storage_object_key_snapshot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (revision_id, attachment_id),
  CONSTRAINT work_order_revision_attachments_display_order_check CHECK (display_order >= 0)
);

DO $revision_asset_guards$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'work_order_revision_images',
    'work_order_revision_attachments'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION wafl_v2_guard_mutable_revision_child()',
      table_name || '_mutable_revision_guard',
      table_name
    );
  END LOOP;
END
$revision_asset_guards$;

DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'work_order_images',
    'work_order_attachments',
    'work_order_revision_images',
    'work_order_revision_attachments'
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
