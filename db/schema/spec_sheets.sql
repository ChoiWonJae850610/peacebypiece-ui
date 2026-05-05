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
  is_active boolean NOT NULL DEFAULT true,
  delete_status text NOT NULL DEFAULT 'active',
  purge_status text NOT NULL DEFAULT 'none',
  purge_requested_at timestamptz,
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
    purge_status IN ('none', 'pending', 'purge_requested', 'purged', 'failed', 'restored')
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


CREATE INDEX IF NOT EXISTS spec_sheets_delete_status_idx
  ON spec_sheets (delete_status, deleted_at DESC);

CREATE INDEX IF NOT EXISTS spec_sheets_purge_status_idx
  ON spec_sheets (purge_status, purge_requested_at DESC, purged_at DESC);
