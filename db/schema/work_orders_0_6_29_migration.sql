ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS base_title text,
  ADD COLUMN IF NOT EXISTS display_title text,
  ADD COLUMN IF NOT EXISTS work_order_kind text,
  ADD COLUMN IF NOT EXISTS reorder_group_id text,
  ADD COLUMN IF NOT EXISTS reorder_round integer,
  ADD COLUMN IF NOT EXISTS is_defect_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE work_orders
SET
  base_title = COALESCE(base_title, NULLIF(payload->>'baseTitle', ''), NULLIF(payload->>'title', ''), title),
  display_title = COALESCE(display_title, NULLIF(payload->>'displayTitle', ''), title),
  work_order_kind = COALESCE(work_order_kind, NULLIF(payload->>'workOrderKind', '')),
  reorder_group_id = COALESCE(reorder_group_id, NULLIF(payload->>'reorderGroupId', ''), id),
  reorder_round = COALESCE(reorder_round, NULLIF(payload->>'reorderRound', '')::integer, 1),
  is_defect_order = COALESCE(is_defect_order, NULLIF(payload->>'isDefectOrder', '')::boolean, false)
WHERE true;

UPDATE work_orders
SET work_order_kind = CASE
  WHEN work_order_kind IN ('sample', 'main', 'rework') THEN work_order_kind
  WHEN is_defect_order = true THEN 'rework'
  WHEN COALESCE(reorder_round, 1) > 1 THEN 'main'
  ELSE 'sample'
END
WHERE true;

UPDATE work_orders
SET display_title = CASE
  WHEN work_order_kind = 'sample' THEN CONCAT(COALESCE(base_title, title), ' (샘플)')
  WHEN work_order_kind = 'rework' THEN CONCAT(COALESCE(base_title, title), ' ', COALESCE(reorder_round, 1), '차 (불량)')
  ELSE CONCAT(COALESCE(base_title, title), ' ', COALESCE(reorder_round, 1), '차')
END
WHERE COALESCE(display_title, '') = '';

UPDATE work_orders
SET title = COALESCE(base_title, title)
WHERE true;

CREATE INDEX IF NOT EXISTS work_orders_reorder_group_idx
  ON work_orders (reorder_group_id, reorder_round);

CREATE INDEX IF NOT EXISTS work_orders_active_idx
  ON work_orders (is_active, updated_at DESC);
