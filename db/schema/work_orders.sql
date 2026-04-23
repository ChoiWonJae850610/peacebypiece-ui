CREATE TABLE IF NOT EXISTS work_orders (
  id text PRIMARY KEY,
  title text NOT NULL,
  base_title text,
  display_title text,
  work_order_kind text,
  reorder_group_id text,
  reorder_round integer,
  is_defect_order boolean NOT NULL DEFAULT false,
  workflow_state text NOT NULL DEFAULT 'draft',
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_orders_updated_at_idx
  ON work_orders (updated_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS work_orders_reorder_group_idx
  ON work_orders (reorder_group_id, reorder_round);

CREATE INDEX IF NOT EXISTS work_orders_active_idx
  ON work_orders (is_active, updated_at DESC);
