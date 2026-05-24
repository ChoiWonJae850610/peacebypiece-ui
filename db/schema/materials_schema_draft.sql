-- WAFLOW / PeaceByPiece materials schema draft
-- Version: 0.16.18
-- Purpose: design/reference for the 0.16.18 full_reset materials tables.
-- Note: 0.16.18 applies the first actual DB/API connection through full_reset.sql.

CREATE TABLE materials (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('fabric', 'submaterial')),
  code text NOT NULL,
  name text NOT NULL,
  category_id text REFERENCES item_categories(id) ON DELETE SET NULL,
  partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  unit text NOT NULL CHECK (unit IN ('yd', 'm', 'roll', 'ea', 'set', 'pack', 'kg')),
  lifecycle_status text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_status IN ('draft', 'active', 'inactive', 'archived')),
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT materials_company_code_unique UNIQUE (company_id, code)
);

CREATE TABLE material_attributes_fabric (
  material_id text PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
  composition text,
  width_value numeric(10, 2),
  width_unit text CHECK (width_unit IN ('inch', 'cm')),
  weight_value numeric(10, 2),
  weight_unit text CHECK (weight_unit IN ('gsm')),
  color_name text
);

CREATE TABLE material_attributes_submaterial (
  material_id text PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
  specification text,
  color_name text,
  size_label text
);

CREATE TABLE workorder_material_lines (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workorder_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  material_id text NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (
    role IN ('main_fabric', 'lining', 'trim', 'label', 'packaging', 'other')
  ),
  required_quantity numeric(12, 3),
  unit text NOT NULL CHECK (unit IN ('yd', 'm', 'roll', 'ea', 'set', 'pack', 'kg')),
  order_status text NOT NULL DEFAULT 'not_requested'
    CHECK (
      order_status IN (
        'not_requested',
        'request_pending',
        'ordered',
        'partially_received',
        'received',
        'cancelled'
      )
    ),
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX materials_company_kind_status_idx
  ON materials (company_id, kind, lifecycle_status);

CREATE INDEX materials_company_partner_idx
  ON materials (company_id, partner_id);

CREATE INDEX materials_company_code_idx
  ON materials (company_id, code);

CREATE INDEX materials_company_name_idx
  ON materials (company_id, lower(name));

CREATE INDEX workorder_material_lines_company_workorder_idx
  ON workorder_material_lines (company_id, workorder_id);

CREATE INDEX workorder_material_lines_company_material_idx
  ON workorder_material_lines (company_id, material_id);

CREATE INDEX workorder_material_lines_company_order_status_idx
  ON workorder_material_lines (company_id, order_status);
