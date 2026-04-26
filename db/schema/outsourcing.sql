CREATE TABLE IF NOT EXISTS spec_sheet_outsourcing_lines (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_outsourcing_id text,
  process text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text,
  payload jsonb,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spec_sheet_outsourcing_lines_spec_sheet_idx
  ON spec_sheet_outsourcing_lines (spec_sheet_id);

CREATE INDEX IF NOT EXISTS spec_sheet_outsourcing_lines_process_idx
  ON spec_sheet_outsourcing_lines (process);

CREATE INDEX IF NOT EXISTS spec_sheet_outsourcing_lines_active_idx
  ON spec_sheet_outsourcing_lines (is_active, updated_at DESC, created_at DESC);
