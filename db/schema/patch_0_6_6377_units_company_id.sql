-- =========================================
-- PeaceByPiece patch 0.6.6377
-- units 테이블 고객사별 단위 기준 분리
-- =========================================

BEGIN;

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS company_id text;

UPDATE units
SET company_id = COALESCE(company_id, 'company-sample-customer')
WHERE company_id IS NULL;

ALTER TABLE units
  DROP CONSTRAINT IF EXISTS units_code_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'units_company_code_unique'
  ) THEN
    ALTER TABLE units
      ADD CONSTRAINT units_company_code_unique UNIQUE (company_id, code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS units_company_active_idx
  ON units (company_id, is_active, sort_order, name);

COMMIT;
