CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_order_entry_id text,
  factory_partner_id text,
  factory_name text,
  quantity integer NOT NULL DEFAULT 0,
  due_date text,
  status text NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_spec_sheet_idx
  ON orders (spec_sheet_id);

CREATE INDEX IF NOT EXISTS orders_factory_partner_idx
  ON orders (factory_partner_id);

CREATE INDEX IF NOT EXISTS orders_active_idx
  ON orders (is_active, updated_at DESC, created_at DESC);
