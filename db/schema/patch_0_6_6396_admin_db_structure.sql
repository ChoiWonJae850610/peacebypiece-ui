-- =========================================
-- PeaceByPiece 0.6.6396
-- 관리자 DB 구조 정리 패치
-- 목적: users 테이블 추가, company_id 기준 인덱스 보강, 히스토리/첨부/작지 조회 성능 기준 정리
-- =========================================

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'designer',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'designer', 'inspector', 'system'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_company_email_unique
  ON users (company_id, lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_company_active_idx
  ON users (company_id, is_active, role, name);

CREATE INDEX IF NOT EXISTS spec_sheets_company_status_updated_idx
  ON spec_sheets (company_id, status, updated_at DESC)
  WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX IF NOT EXISTS orders_company_status_due_idx
  ON orders (company_id, status, due_date)
  WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX IF NOT EXISTS partners_company_active_name_idx
  ON partners (company_id, is_active, name);

CREATE INDEX IF NOT EXISTS partner_items_company_type_active_idx
  ON partner_items (company_id, item_type, is_active);

CREATE INDEX IF NOT EXISTS attachments_company_type_created_idx
  ON attachments (company_id, type, created_at DESC)
  WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX IF NOT EXISTS attachment_trash_items_company_status_deleted_idx
  ON attachment_trash_items (company_id, purge_status, deleted_at DESC)
  WHERE restored_at IS NULL AND purged_at IS NULL;

CREATE INDEX IF NOT EXISTS history_logs_company_created_idx
  ON history_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS history_logs_company_action_created_idx
  ON history_logs (company_id, action_type, created_at DESC);

INSERT INTO users (id, company_id, email, name, role, is_active) VALUES
  ('user-sample-admin', 'company-sample-customer', 'admin@example.com', '샘플 관리자', 'admin', true),
  ('user-sample-designer', 'company-sample-customer', 'designer@example.com', '샘플 디자이너', 'designer', true),
  ('user-sample-inspector', 'company-sample-customer', 'inspector@example.com', '샘플 검수담당자', 'inspector', true)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
