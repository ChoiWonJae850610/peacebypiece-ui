-- WAFLOW / PeaceByPiece materials schema draft
-- Version: 0.16.17
-- Purpose: design reference only. Do not execute as a migration yet.
-- Note: full_reset.sql is intentionally unchanged in 0.16.17.

CREATE TABLE materials (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('fabric', 'submaterial')),
  code text NOT NULL,
  name text NOT NULL,
  category_id uuid,
  partner_id uuid,
  unit text NOT NULL CHECK (unit IN ('yd', 'm', 'roll', 'ea', 'set', 'pack', 'kg')),
  lifecycle_status text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_status IN ('draft', 'active', 'inactive', 'archived')),
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT materials_company_code_unique UNIQUE (company_id, code)
);

CREATE TABLE material_attributes_fabric (
  material_id uuid PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
  composition text,
  width_value numeric(10, 2),
  width_unit text CHECK (width_unit IN ('inch', 'cm')),
  weight_value numeric(10, 2),
  weight_unit text CHECK (weight_unit IN ('gsm')),
  color_name text
);

CREATE TABLE material_attributes_submaterial (
  material_id uuid PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
  specification text,
  color_name text,
  size_label text
);

CREATE TABLE workorder_material_lines (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  workorder_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES materials(id),
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

CREATE INDEX idx_materials_company_kind_status
  ON materials (company_id, kind, lifecycle_status);

CREATE INDEX idx_materials_company_partner
  ON materials (company_id, partner_id);

CREATE INDEX idx_materials_company_code
  ON materials (company_id, code);

CREATE INDEX idx_workorder_material_lines_company_workorder
  ON workorder_material_lines (company_id, workorder_id);

CREATE INDEX idx_workorder_material_lines_company_material
  ON workorder_material_lines (company_id, material_id);

CREATE INDEX idx_workorder_material_lines_company_order_status
  ON workorder_material_lines (company_id, order_status);
