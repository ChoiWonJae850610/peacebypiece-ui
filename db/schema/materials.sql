CREATE TABLE IF NOT EXISTS spec_sheet_materials (
  id text PRIMARY KEY,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  material_type text,
  name text,
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

CREATE INDEX IF NOT EXISTS spec_sheet_materials_spec_sheet_idx
  ON spec_sheet_materials (spec_sheet_id);

CREATE INDEX IF NOT EXISTS spec_sheet_materials_type_idx
  ON spec_sheet_materials (material_type);

CREATE INDEX IF NOT EXISTS spec_sheet_materials_active_idx
  ON spec_sheet_materials (is_active, updated_at DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS material_stocks (
  id text PRIMARY KEY,
  material_type text,
  name text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  source_spec_sheet_id text REFERENCES spec_sheets(id) ON DELETE SET NULL,
  source_spec_sheet_material_id text REFERENCES spec_sheet_materials(id) ON DELETE SET NULL,
  payload jsonb,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS material_stocks_source_spec_sheet_idx
  ON material_stocks (source_spec_sheet_id);

CREATE INDEX IF NOT EXISTS material_stocks_type_idx
  ON material_stocks (material_type);

CREATE INDEX IF NOT EXISTS material_stocks_active_idx
  ON material_stocks (is_active, updated_at DESC, created_at DESC);
