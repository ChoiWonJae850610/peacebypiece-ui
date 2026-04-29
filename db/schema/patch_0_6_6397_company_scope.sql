-- =========================================
-- PeaceByPiece 0.6.6397
-- company_id 전면 적용 / 멀티테넌시 기준 고정
-- =========================================

BEGIN;

INSERT INTO companies (id, name, memo, is_active)
VALUES ('company-sample-customer', '샘플 고객사', '기본 샘플 고객사', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  memo = EXCLUDED.memo,
  is_active = EXCLUDED.is_active,
  updated_at = now();

UPDATE units SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE item_categories SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE outsourcing_processes SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE partners SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE partner_items SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE spec_sheets SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE orders SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE spec_sheet_materials SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE material_stocks SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE spec_sheet_outsourcing_lines SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE attachments SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE attachment_trash_items SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE memos SET company_id = 'company-sample-customer' WHERE company_id IS NULL;
UPDATE history_logs SET company_id = 'company-sample-customer' WHERE company_id IS NULL;

ALTER TABLE units ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE item_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE outsourcing_processes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE partners ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE partner_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE spec_sheets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE spec_sheet_materials ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE material_stocks ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE spec_sheet_outsourcing_lines ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE attachments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE attachment_trash_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE memos ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE history_logs ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS outsourcing_processes_company_active_idx ON outsourcing_processes (company_id, is_active, sort_order, name);
CREATE INDEX IF NOT EXISTS orders_company_spec_sheet_idx ON orders (company_id, spec_sheet_id);
CREATE INDEX IF NOT EXISTS spec_sheet_materials_company_spec_sheet_idx ON spec_sheet_materials (company_id, spec_sheet_id);
CREATE INDEX IF NOT EXISTS spec_sheet_outsourcing_lines_company_spec_sheet_idx ON spec_sheet_outsourcing_lines (company_id, spec_sheet_id);
CREATE INDEX IF NOT EXISTS memos_company_order_idx ON memos (company_id, order_id);

COMMIT;
