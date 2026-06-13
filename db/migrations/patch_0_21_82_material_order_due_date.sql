-- 0.21.82: 발주서 선택 납기일
ALTER TABLE material_orders
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_material_orders_company_due_date
  ON material_orders (company_id, due_date);
