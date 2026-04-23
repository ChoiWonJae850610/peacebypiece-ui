CREATE TABLE IF NOT EXISTS work_orders (
  id text PRIMARY KEY,
  title text NOT NULL,
  workflow_state text NOT NULL DEFAULT 'draft',
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_orders_updated_at_idx
  ON work_orders (updated_at DESC, created_at DESC);
