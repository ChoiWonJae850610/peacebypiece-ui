-- Patch 0.17.65
-- Store the source workorder material key for partial material-order allocation calculations.

ALTER TABLE material_order_allocations
  ADD COLUMN IF NOT EXISTS source_material_key text;

CREATE INDEX IF NOT EXISTS idx_material_order_allocations_source_material
  ON material_order_allocations(company_id, work_order_id, source_material_key);
