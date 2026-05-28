ALTER TABLE spec_sheets
  ADD COLUMN IF NOT EXISTS workflow_path text NOT NULL DEFAULT 'standard_review';

ALTER TABLE material_orders
  ADD COLUMN IF NOT EXISTS workflow_path text NOT NULL DEFAULT 'standard_review';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'spec_sheets_workflow_path_check'
  ) THEN
    ALTER TABLE spec_sheets
      ADD CONSTRAINT spec_sheets_workflow_path_check
      CHECK (workflow_path IN ('standard_review', 'direct_order'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'material_orders_workflow_path_check'
  ) THEN
    ALTER TABLE material_orders
      ADD CONSTRAINT material_orders_workflow_path_check
      CHECK (workflow_path IN ('standard_review', 'direct_order'));
  END IF;
END $$;
