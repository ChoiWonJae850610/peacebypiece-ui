-- WAFLOW / PeaceByPiece materials schema draft
-- Version: 0.16.93
-- Purpose: design/reference for the material and material-order tables applied through full_reset.sql.
-- Note: this draft keeps the same table direction as db/schema/full_reset.sql.

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

CREATE TABLE material_orders (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (
      status IN (
        'draft',
        'review_requested',
        'approved',
        'order_placed',
        'rejected',
        'cancelled'
      )
    ),
  workflow_path text NOT NULL DEFAULT 'standard_review'
    CHECK (workflow_path IN ('standard_review', 'direct_order')),
  requested_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  approved_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  ordered_at timestamptz,
  total_amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE material_order_lines (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_order_id text NOT NULL REFERENCES material_orders(id) ON DELETE CASCADE,
  partner_item_id text REFERENCES partner_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('fabric', 'submaterial')),
  color text,
  spec text,
  unit text NOT NULL,
  order_quantity numeric(14, 3) NOT NULL DEFAULT 0 CHECK (order_quantity >= 0),
  unit_price numeric(14, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE material_order_allocations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_order_line_id text NOT NULL REFERENCES material_order_lines(id) ON DELETE CASCADE,
  work_order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  allocated_quantity numeric(14, 3) NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  allocation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE material_inventory_lots (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_order_line_id text REFERENCES material_order_lines(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  unit text NOT NULL,
  received_quantity numeric(14, 3) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  allocated_quantity numeric(14, 3) NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  remaining_quantity numeric(14, 3) NOT NULL DEFAULT 0 CHECK (remaining_quantity >= 0),
  unit_price numeric(14, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT material_inventory_lots_allocation_bounds_check
    CHECK (allocated_quantity <= received_quantity)
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

CREATE INDEX material_orders_company_status_idx
  ON material_orders (company_id, status, updated_at DESC);

CREATE INDEX material_orders_supplier_partner_idx
  ON material_orders (company_id, supplier_partner_id);

CREATE INDEX material_order_lines_company_order_idx
  ON material_order_lines (company_id, material_order_id);

CREATE INDEX material_order_allocations_company_work_order_idx
  ON material_order_allocations (company_id, work_order_id);

CREATE INDEX material_inventory_lots_company_remaining_idx
  ON material_inventory_lots (company_id, remaining_quantity);
