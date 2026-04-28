-- =========================================
-- PeaceByPiece full DB reset schema
-- 기준: 현재 코드에서 실제 사용하는 테이블/컬럼명 기준
-- 주의: 실행하면 아래 전체 업무 테이블의 기존 데이터가 모두 삭제됩니다.
-- =========================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- 1) DROP TABLES
-- FK / index / dependent constraints are removed by CASCADE.
-- =========================================

DROP TABLE IF EXISTS material_allocations CASCADE;
DROP TABLE IF EXISTS material_order_lines CASCADE;
DROP TABLE IF EXISTS material_orders CASCADE;

DROP TABLE IF EXISTS memos CASCADE;
DROP TABLE IF EXISTS attachment_trash_items CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS spec_sheet_outsourcing_lines CASCADE;
DROP TABLE IF EXISTS material_stocks CASCADE;
DROP TABLE IF EXISTS spec_sheet_materials CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS partner_items CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS outsourcing_processes CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS spec_sheets CASCADE;



-- =========================================
-- 2) MASTER TABLES
-- =========================================

CREATE TABLE companies (
  id text PRIMARY KEY,
  name text NOT NULL,
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE company_settings (
  company_id text PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  theme_color text NOT NULL DEFAULT 'blue',
  language text NOT NULL DEFAULT 'ko',
  compact_mode boolean NOT NULL DEFAULT false,
  soft_delete_enabled boolean NOT NULL DEFAULT true,
  include_trash_in_usage boolean NOT NULL DEFAULT true,
  trash_retention_days integer NOT NULL DEFAULT 15,
  storage_limit_gb integer NOT NULL DEFAULT 5,
  warning_threshold_percent integer NOT NULL DEFAULT 80,
  review_request_enabled boolean NOT NULL DEFAULT true,
  order_ready_enabled boolean NOT NULL DEFAULT true,
  storage_warning_enabled boolean NOT NULL DEFAULT true,
  purge_result_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT company_settings_theme_color_check
    CHECK (theme_color IN ('blue', 'emerald', 'violet', 'stone')),
  CONSTRAINT company_settings_language_check
    CHECK (language IN ('ko', 'en')),
  CONSTRAINT company_settings_trash_retention_days_check
    CHECK (trash_retention_days IN (1, 5, 15, 30)),
  CONSTRAINT company_settings_storage_limit_gb_check
    CHECK (storage_limit_gb > 0),
  CONSTRAINT company_settings_warning_threshold_percent_check
    CHECK (warning_threshold_percent BETWEEN 1 AND 100)
);

CREATE TABLE units (
  id text PRIMARY KEY,
  company_id text,
  code text NOT NULL,
  name text NOT NULL,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT units_company_code_unique UNIQUE (company_id, code)
);

-- ================================
-- outsourcing_processes
-- 관리자가 외주 공정관리 모달에서 관리
-- ================================
CREATE TABLE outsourcing_processes (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  name text NOT NULL,
  memo text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- partners
-- 업체 기본정보만 저장
-- type 단일값 의존 금지
-- ================================
CREATE TABLE partners (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  name text NOT NULL,
  contact_person text,
  contact text,
  email text,
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- partner_items
-- 업체 역할/취급항목 다중 저장
-- item_type: factory / fabric / subsidiary / outsourcing
-- ================================
CREATE TABLE partner_items (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  partner_id text NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_name text,
  outsourcing_process_id text REFERENCES outsourcing_processes(id) ON DELETE SET NULL,
  unit text,
  unit_cost numeric(14, 2) NOT NULL DEFAULT 0,
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT partner_items_type_check
    CHECK (item_type IN ('factory', 'fabric', 'subsidiary', 'outsourcing'))
);

-- =========================================
-- 3) CORE SPEC SHEET TABLE
-- payload is still included because the current code reads/writes it.
-- =========================================

CREATE TABLE spec_sheets (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  work_order_kind text,
  reorder_group_id text,
  reorder_round integer NOT NULL DEFAULT 0,
  parent_spec_sheet_id text REFERENCES spec_sheets(id) ON DELETE SET NULL,
  is_rework boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone
);

-- =========================================
-- 4) FACTORY ORDERS
-- =========================================

CREATE TABLE orders (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_order_entry_id text,
  factory_partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  factory_name text,
  quantity integer NOT NULL DEFAULT 0,
  due_date text,
  labor_cost integer NOT NULL DEFAULT 0,
  loss_cost integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- 5) MATERIALS
-- =========================================

CREATE TABLE spec_sheet_materials (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_material_id text,
  material_type text,
  name text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text,
  payload jsonb,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE material_stocks (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  source_order_line_id text,
  available_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  reserved_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  material_type text,
  name text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  source_spec_sheet_id text REFERENCES spec_sheets(id) ON DELETE SET NULL,
  source_spec_sheet_material_id text REFERENCES spec_sheet_materials(id) ON DELETE SET NULL,
  payload jsonb,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- 6) OUTSOURCING
-- =========================================

CREATE TABLE spec_sheet_outsourcing_lines (
  id text PRIMARY KEY,
  company_id text,
  company_name text,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_outsourcing_id text,
  process text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text,
  payload jsonb,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- 7) ATTACHMENTS
-- Current code uses order_id/storage_key/original_name/mime_type/size_bytes/type/is_primary.
-- Thumbnail columns are included for the thumbnail strategy.
-- =========================================

CREATE TABLE attachments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text,
  company_name text,
  order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'file',
  storage_key text NOT NULL,
  original_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  author_id text,
  is_primary boolean NOT NULL DEFAULT false,
  thumbnail_key text,
  thumbnail_url text,
  preview_url text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  deleted_by text,
  delete_reason text,
  purge_after_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- 8) ATTACHMENT TRASH ITEMS
-- 소프트 삭제된 첨부파일의 휴지통 보관/복구/실제 삭제 예약 정보를 저장합니다.
-- 휴지통 보관 중인 파일은 R2에서 즉시 삭제하지 않으므로 사용량 계산에 계속 포함합니다.
-- =========================================

CREATE TABLE attachment_trash_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text,
  company_name text,
  attachment_id text NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  thumbnail_key text,
  original_name text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  deleted_by text,
  delete_reason text,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  purge_after_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  restored_at timestamptz,
  restored_by text,
  purged_at timestamptz,
  purge_status text NOT NULL DEFAULT 'pending',
  purge_attempt_count integer NOT NULL DEFAULT 0,
  last_purge_attempt_at timestamptz,
  last_purge_error text,
  CONSTRAINT attachment_trash_items_purge_status_check
    CHECK (purge_status IN ('pending', 'restored', 'purge_requested', 'purged', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- 9) MEMOS
-- Current code uses order_id / parent_id / body / author_id.
-- =========================================

CREATE TABLE memos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text,
  company_name text,
  order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  parent_id text REFERENCES memos(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ================================
-- material_orders
-- 원단/부자재 발주서 헤더
-- ================================
CREATE TABLE material_orders (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  company_name text NOT NULL,
  order_no text,
  vendor_partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  order_date date,
  expected_received_date date,
  received_date date,
  memo text,
  created_by_id text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT material_orders_status_check
    CHECK (status IN ('draft', 'requested', 'ordered', 'partially_received', 'received', 'cancelled'))
);

CREATE INDEX idx_material_orders_company_id ON material_orders(company_id);
CREATE INDEX idx_material_orders_vendor_partner_id ON material_orders(vendor_partner_id);
CREATE INDEX idx_material_orders_status ON material_orders(status);


-- ================================
-- material_order_lines
-- 원단/부자재 발주 상세
-- ================================
CREATE TABLE material_order_lines (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  company_name text NOT NULL,
  material_order_id text NOT NULL REFERENCES material_orders(id) ON DELETE CASCADE,
  spec_sheet_id text REFERENCES spec_sheets(id) ON DELETE SET NULL,
  spec_sheet_material_id text REFERENCES spec_sheet_materials(id) ON DELETE SET NULL,
  partner_item_id text REFERENCES partner_items(id) ON DELETE SET NULL,
  material_type text NOT NULL,
  name text NOT NULL,
  unit text,
  ordered_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  received_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  unit_cost numeric(14, 2) NOT NULL DEFAULT 0,
  total_cost numeric(14, 2) NOT NULL DEFAULT 0,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT material_order_lines_type_check
    CHECK (material_type IN ('fabric', 'subsidiary'))
);

CREATE INDEX idx_material_order_lines_company_id ON material_order_lines(company_id);
CREATE INDEX idx_material_order_lines_order_id ON material_order_lines(material_order_id);
CREATE INDEX idx_material_order_lines_spec_sheet_id ON material_order_lines(spec_sheet_id);
CREATE INDEX idx_material_order_lines_material_id ON material_order_lines(spec_sheet_material_id);
CREATE INDEX idx_material_order_lines_partner_item_id ON material_order_lines(partner_item_id);


-- ================================
-- material_allocations
-- 재고를 작지에 할당한 기록
-- ================================
CREATE TABLE material_allocations (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  company_name text NOT NULL,
  material_stock_id text REFERENCES material_stocks(id) ON DELETE SET NULL,
  material_order_line_id text REFERENCES material_order_lines(id) ON DELETE SET NULL,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  spec_sheet_material_id text REFERENCES spec_sheet_materials(id) ON DELETE SET NULL,
  material_type text NOT NULL,
  name text NOT NULL,
  unit text,
  allocated_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  memo text,
  allocated_by_id text,
  allocated_by_name text,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT material_allocations_type_check
    CHECK (material_type IN ('fabric', 'subsidiary'))
);

CREATE INDEX idx_material_allocations_company_id ON material_allocations(company_id);
CREATE INDEX idx_material_allocations_stock_id ON material_allocations(material_stock_id);
CREATE INDEX idx_material_allocations_order_line_id ON material_allocations(material_order_line_id);
CREATE INDEX idx_material_allocations_spec_sheet_id ON material_allocations(spec_sheet_id);
CREATE INDEX idx_material_allocations_material_id ON material_allocations(spec_sheet_material_id);





-- =========================================
-- 9) UNITS SEED DATA
-- 기준: lib/partners/mockPartnerRepository.ts MOCK_UNITS
-- =========================================

INSERT INTO companies (id, name, memo, is_active) VALUES
  ('company-sample-customer', '샘플 고객사', '기본 샘플 고객사', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  memo = EXCLUDED.memo,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO company_settings (company_id) VALUES
  ('company-sample-customer')
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO units (id, company_id, code, name, category, is_active, sort_order)
VALUES
  ('mock-unit-piece', 'company-sample-customer', 'piece', '개', 'count', true, 10),
  ('mock-unit-sheet', 'company-sample-customer', 'sheet', '장', 'count', true, 20),
  ('mock-unit-set', 'company-sample-customer', 'set', '세트', 'count', true, 30),
  ('mock-unit-yard', 'company-sample-customer', 'yard', '야드', 'length', true, 40),
  ('mock-unit-meter', 'company-sample-customer', 'meter', '미터', 'length', true, 50),
  ('mock-unit-roll', 'company-sample-customer', 'roll', '롤', 'bundle', true, 60),
  ('mock-unit-pack', 'company-sample-customer', 'pack', '팩', 'bundle', true, 70),
  ('mock-unit-box', 'company-sample-customer', 'box', '박스', 'bundle', true, 80),
  ('mock-unit-process', 'company-sample-customer', 'process', '공정', 'service', true, 90),
  ('mock-unit-case', 'company-sample-customer', 'case', '건', 'service', true, 100);


INSERT INTO outsourcing_processes (id, company_id, company_name, name, sort_order) VALUES
('process-cutting', 'company-sample-customer', '샘플 고객사', '재단', 10),
('process-printing', 'company-sample-customer', '샘플 고객사', '나염', 20),
('process-embroidery', 'company-sample-customer', '샘플 고객사', '자수', 30),
('process-washing', 'company-sample-customer', '샘플 고객사', '워싱', 40),
('process-finishing', 'company-sample-customer', '샘플 고객사', '후가공', 50);

-- =========================================
-- 10) INDEXES
-- =========================================

CREATE INDEX companies_active_name_idx
  ON companies (is_active, name);

CREATE INDEX company_settings_company_idx
  ON company_settings (company_id);

CREATE INDEX units_company_active_idx
  ON units (company_id, is_active, sort_order, name);

CREATE INDEX units_active_idx
  ON units (is_active, sort_order, name);

CREATE INDEX partners_active_name_idx
  ON partners (is_active, name);

CREATE INDEX partners_company_idx
  ON partners (company_id);

CREATE INDEX partner_items_partner_id_idx
  ON partner_items (partner_id);

CREATE INDEX partner_items_type_active_idx
  ON partner_items (item_type, is_active);

CREATE INDEX partner_items_outsourcing_process_id_idx
  ON partner_items (outsourcing_process_id);

CREATE INDEX spec_sheets_updated_at_idx
  ON spec_sheets (updated_at DESC, created_at DESC);

CREATE INDEX spec_sheets_reorder_group_idx
  ON spec_sheets (reorder_group_id, reorder_round);

CREATE INDEX spec_sheets_active_idx
  ON spec_sheets (is_active, updated_at DESC);

CREATE INDEX spec_sheets_parent_idx
  ON spec_sheets (parent_spec_sheet_id);

CREATE INDEX orders_spec_sheet_idx
  ON orders (spec_sheet_id);

CREATE INDEX orders_factory_partner_idx
  ON orders (factory_partner_id);

CREATE INDEX orders_active_idx
  ON orders (is_active, updated_at DESC, created_at DESC);

CREATE INDEX orders_source_order_entry_idx
  ON orders (source_order_entry_id);

CREATE INDEX orders_spec_sheet_active_idx
  ON orders (spec_sheet_id, is_active);

CREATE INDEX spec_sheet_materials_spec_sheet_idx
  ON spec_sheet_materials (spec_sheet_id);

CREATE INDEX spec_sheet_materials_type_idx
  ON spec_sheet_materials (material_type);

CREATE INDEX spec_sheet_materials_active_idx
  ON spec_sheet_materials (is_active, updated_at DESC, created_at DESC);

CREATE INDEX material_stocks_source_spec_sheet_idx
  ON material_stocks (source_spec_sheet_id);

CREATE INDEX material_stocks_source_material_idx
  ON material_stocks (source_spec_sheet_material_id);

CREATE INDEX material_stocks_type_idx
  ON material_stocks (material_type);

CREATE INDEX material_stocks_active_idx
  ON material_stocks (is_active, updated_at DESC, created_at DESC);

CREATE INDEX spec_sheet_outsourcing_lines_spec_sheet_idx
  ON spec_sheet_outsourcing_lines (spec_sheet_id);

CREATE INDEX spec_sheet_outsourcing_lines_process_idx
  ON spec_sheet_outsourcing_lines (process);

CREATE INDEX spec_sheet_outsourcing_lines_active_idx
  ON spec_sheet_outsourcing_lines (is_active, updated_at DESC, created_at DESC);

CREATE INDEX attachments_order_idx
  ON attachments (order_id);

CREATE INDEX attachments_order_type_active_idx
  ON attachments (order_id, type, is_active, created_at ASC);

CREATE INDEX attachments_storage_key_idx
  ON attachments (storage_key);

CREATE INDEX attachments_primary_design_idx
  ON attachments (order_id, type, is_primary)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX attachments_admin_active_list_idx
  ON attachments (created_at DESC)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE UNIQUE INDEX attachment_trash_items_pending_attachment_unique_idx
  ON attachment_trash_items (attachment_id)
  WHERE purge_status IN ('pending', 'purge_requested') AND restored_at IS NULL AND purged_at IS NULL;

CREATE INDEX attachment_trash_items_attachment_idx
  ON attachment_trash_items (attachment_id);

CREATE INDEX attachment_trash_items_order_idx
  ON attachment_trash_items (order_id);

CREATE INDEX attachment_trash_items_company_idx
  ON attachment_trash_items (company_id, deleted_at DESC);

CREATE INDEX attachment_trash_items_purge_idx
  ON attachment_trash_items (purge_status, purge_after_at);

CREATE INDEX attachment_trash_items_purge_candidate_idx
  ON attachment_trash_items (purge_after_at ASC)
  WHERE restored_at IS NULL AND purged_at IS NULL AND purge_status IN ('pending', 'purge_requested');

CREATE INDEX attachment_trash_items_pending_list_idx
  ON attachment_trash_items (deleted_at DESC)
  WHERE restored_at IS NULL AND purged_at IS NULL AND purge_status = 'pending';

CREATE INDEX attachment_trash_items_admin_status_list_idx
  ON attachment_trash_items (purge_status, deleted_at DESC)
  WHERE restored_at IS NULL AND purged_at IS NULL;

CREATE INDEX attachment_trash_items_purge_retry_idx
  ON attachment_trash_items (purge_attempt_count, last_purge_attempt_at)
  WHERE purged_at IS NULL AND restored_at IS NULL;



CREATE INDEX IF NOT EXISTS idx_attachments_deleted_at
ON attachments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_attachments_purge_after
ON attachments(purge_after_at);

CREATE INDEX IF NOT EXISTS idx_attachments_deleted_purge_after
ON attachments(purge_after_at)
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attachments_company_active
ON attachments(company_id, created_at DESC)
WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX memos_order_idx
  ON memos (order_id);

CREATE INDEX memos_parent_idx
  ON memos (parent_id);

CREATE INDEX memos_order_active_idx
  ON memos (order_id, is_active, created_at ASC);

COMMIT;
