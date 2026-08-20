-- WAFL v2 alpha.66 additive WorkOrder identity/lineage foundation.
-- DEV/TEST APPLY ONLY. Production execution is prohibited.

BEGIN;

DO $alpha66_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.66-lineage-sample-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 019 requires the approved alpha.66 dev/test runner';
  END IF;
END
$alpha66_gate$;

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS derivation_kind text NOT NULL DEFAULT 'original',
  ADD COLUMN IF NOT EXISTS source_work_order_id uuid,
  ADD COLUMN IF NOT EXISTS source_revision_id uuid,
  ADD COLUMN IF NOT EXISTS series_root_work_order_id uuid,
  ADD COLUMN IF NOT EXISTS reorder_round integer NOT NULL DEFAULT 0;

ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_derivation_kind_check
    CHECK (derivation_kind IN ('original', 'reorder', 'rework')),
  ADD CONSTRAINT work_orders_reorder_round_check CHECK (reorder_round >= 0),
  ADD CONSTRAINT work_orders_lineage_shape_check CHECK (
    (derivation_kind = 'original'
      AND source_work_order_id IS NULL
      AND source_revision_id IS NULL
      AND reorder_round = 0)
    OR
    (derivation_kind = 'reorder'
      AND source_work_order_id IS NOT NULL
      AND source_revision_id IS NOT NULL
      AND series_root_work_order_id IS NOT NULL
      AND reorder_round >= 1)
    OR
    (derivation_kind = 'rework'
      AND source_work_order_id IS NOT NULL
      AND source_revision_id IS NOT NULL
      AND series_root_work_order_id IS NOT NULL)
  ),
  ADD CONSTRAINT work_orders_lineage_not_self_source_check
    CHECK (source_work_order_id IS NULL OR source_work_order_id <> id),
  ADD CONSTRAINT work_orders_source_work_order_fk
    FOREIGN KEY (company_id, source_work_order_id)
    REFERENCES work_orders(company_id, id) ON DELETE RESTRICT,
  ADD CONSTRAINT work_orders_series_root_work_order_fk
    FOREIGN KEY (company_id, series_root_work_order_id)
    REFERENCES work_orders(company_id, id) ON DELETE RESTRICT,
  ADD CONSTRAINT work_orders_source_revision_fk
    FOREIGN KEY (company_id, source_revision_id)
    REFERENCES work_order_revisions(company_id, id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS work_orders_company_derivation_recent_idx
  ON work_orders (company_id, derivation_kind, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS work_orders_company_sample_recent_idx
  ON work_orders (company_id, is_sample, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS work_orders_series_round_idx
  ON work_orders (company_id, series_root_work_order_id, reorder_round, id)
  WHERE series_root_work_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS work_orders_reorder_round_unique_idx
  ON work_orders (company_id, series_root_work_order_id, reorder_round)
  WHERE derivation_kind = 'reorder' AND deleted_at IS NULL;

COMMIT;
