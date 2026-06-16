BEGIN;

DROP TABLE IF EXISTS memos CASCADE;
ALTER TABLE spec_sheets DROP COLUMN IF EXISTS memo;
ALTER TABLE company_workorder_daily_stats DROP COLUMN IF EXISTS memo_count;
ALTER TABLE company_workorder_monthly_stats DROP COLUMN IF EXISTS memo_count;

COMMIT;
