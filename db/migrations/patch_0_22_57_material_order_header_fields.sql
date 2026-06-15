-- 0.22.57 material order header fields
ALTER TABLE material_orders
  ADD COLUMN IF NOT EXISTS material_type text;

UPDATE material_orders orders
SET material_type = source.item_type
FROM (
  SELECT DISTINCT ON (material_order_id)
    material_order_id,
    item_type
  FROM material_order_lines
  ORDER BY material_order_id, created_at ASC, id ASC
) source
WHERE source.material_order_id = orders.id
  AND orders.material_type IS NULL;

ALTER TABLE material_orders
  DROP CONSTRAINT IF EXISTS material_orders_material_type_check;

ALTER TABLE material_orders
  ADD CONSTRAINT material_orders_material_type_check
  CHECK (material_type IS NULL OR material_type IN ('fabric', 'submaterial'));
