CREATE TABLE IF NOT EXISTS spec_sheets (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  work_order_kind text,
  reorder_group_id text,
  reorder_round integer NOT NULL DEFAULT 0,
  parent_spec_sheet_id text,
  is_rework boolean NOT NULL DEFAULT false,
  category1_id text REFERENCES item_categories(id) ON DELETE SET NULL,
  category2_id text REFERENCES item_categories(id) ON DELETE SET NULL,
  category3_id text REFERENCES item_categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  delete_status text NOT NULL DEFAULT 'active',
  purge_status text NOT NULL DEFAULT 'none',
  purge_requested_at timestamptz,
  purge_requested_by text,
  delete_source text,
  delete_scope text,
  delete_parent_type text,
  delete_parent_id text,
  delete_batch_id text,
  purged_at timestamptz,
  purged_by text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone,
  CONSTRAINT spec_sheets_delete_status_check CHECK (
    delete_status IN ('active', 'trashed', 'purge_requested', 'purged', 'restored')
  ),
  CONSTRAINT spec_sheets_purge_status_check CHECK (
    purge_status IN ('none', 'pending', 'purge_requested', 'processing', 'purged', 'failed', 'restored')
  ),
  CONSTRAINT spec_sheets_delete_source_check CHECK (
    delete_source IS NULL OR delete_source IN ('manual', 'workorder_bundle', 'system')
  ),
  CONSTRAINT spec_sheets_delete_scope_check CHECK (
    delete_scope IS NULL OR delete_scope IN ('single', 'bundle')
  ),
  CONSTRAINT spec_sheets_delete_parent_type_check CHECK (
    delete_parent_type IS NULL OR delete_parent_type IN ('none', 'workorder')
  )
);

CREATE INDEX IF NOT EXISTS spec_sheets_updated_at_idx
  ON spec_sheets (updated_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS spec_sheets_reorder_group_idx
  ON spec_sheets (reorder_group_id, reorder_round);

CREATE INDEX IF NOT EXISTS spec_sheets_active_idx
  ON spec_sheets (is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS spec_sheets_parent_idx
  ON spec_sheets (parent_spec_sheet_id);

CREATE INDEX IF NOT EXISTS spec_sheets_category1_idx
  ON spec_sheets (company_id, category1_id);

CREATE INDEX IF NOT EXISTS spec_sheets_category2_idx
  ON spec_sheets (company_id, category2_id);

CREATE INDEX IF NOT EXISTS spec_sheets_category3_idx
  ON spec_sheets (company_id, category3_id);


CREATE INDEX IF NOT EXISTS spec_sheets_delete_status_idx
  ON spec_sheets (delete_status, deleted_at DESC);

CREATE INDEX IF NOT EXISTS spec_sheets_purge_status_idx
  ON spec_sheets (purge_status, purge_requested_at DESC, purged_at DESC);

CREATE INDEX IF NOT EXISTS spec_sheets_delete_metadata_idx
  ON spec_sheets (delete_source, delete_scope, delete_parent_type, delete_parent_id);
