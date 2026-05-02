-- PeaceByPiece 0.9.57
-- 고객사 / 사용자 / 권한 SQL 초안
--
-- 목적:
-- - 0.9.56 설계 문서를 기준으로 SaaS형 테넌트, 사용자 소속, 권한 override 구조를 준비한다.
-- - 기존 인증/회원가입/작업지시서 흐름에는 연결하지 않는다.
-- - 기존 테이블이 이미 있을 수 있으므로 보완형 ALTER / CREATE IF NOT EXISTS 중심으로 작성한다.
--
-- 비목표:
-- - 실제 인증 연결
-- - 결제 연결
-- - 초대 토큰 구현
-- - 기존 role 명칭 강제 변경
-- - 기존 workorder/attachment API 응답 포맷 변경

BEGIN;

-- ================================
-- 1. 고객사 기본 구조 보완
-- ================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_registration_number text,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS default_plan_id uuid,
  ADD COLUMN IF NOT EXISTS storage_limit_bytes bigint,
  ADD COLUMN IF NOT EXISTS member_limit integer,
  ADD COLUMN IF NOT EXISTS billing_status text NOT NULL DEFAULT 'trial';

CREATE INDEX IF NOT EXISTS idx_companies_is_active
  ON companies (is_active);

-- ================================
-- 2. 사용자 기본 구조 보완
-- ================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON users (lower(email));

CREATE INDEX IF NOT EXISTS idx_users_is_active
  ON users (is_active);

-- ================================
-- 3. 고객사 소속 사용자 구조 보완
-- ================================

CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_users
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS joined_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by_user_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_users_company_user_role_unique
  ON company_users (company_id, user_id, role);

CREATE INDEX IF NOT EXISTS idx_company_users_company_id
  ON company_users (company_id);

CREATE INDEX IF NOT EXISTS idx_company_users_user_id
  ON company_users (user_id);

CREATE INDEX IF NOT EXISTS idx_company_users_role
  ON company_users (role);

CREATE INDEX IF NOT EXISTS idx_company_users_active
  ON company_users (is_active);

-- ================================
-- 4. 역할 / 권한 카탈로그
-- ================================

CREATE TABLE IF NOT EXISTS role_catalog (
  role text PRIMARY KEY,
  label text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permission_catalog (
  permission_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role text NOT NULL REFERENCES role_catalog(role) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_key
  ON role_permissions (permission_key);

-- ================================
-- 5. 고객사 사용자별 권한 override
-- ================================

CREATE TABLE IF NOT EXISTS company_user_permissions (
  company_user_id uuid NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_user_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_company_user_permissions_permission_key
  ON company_user_permissions (permission_key);

-- ================================
-- 6. 시스템관리자 권한 분리 준비
-- ================================

CREATE TABLE IF NOT EXISTS system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'system_admin',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_users_email_unique
  ON system_users (lower(email));

CREATE TABLE IF NOT EXISTS system_permission_catalog (
  permission_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'system',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_user_permissions (
  system_user_id uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES system_permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (system_user_id, permission_key)
);

-- ================================
-- 7. 기본 role seed
-- ================================

INSERT INTO role_catalog (role, label, description, is_system, is_active)
VALUES
  ('admin', '관리자', '고객사 내부 관리자 역할', false, true),
  ('designer', '디자이너', '작업지시서 작성 및 검토요청 역할', false, true),
  ('inspector', '검수담당자', '생산 및 검수 확인 역할', false, true),
  ('inventory_manager', '재고담당자', '재고 관리 역할', false, true),
  ('viewer', '조회자', '읽기 중심 역할', false, true)
ON CONFLICT (role) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ================================
-- 8. 기본 permission seed
-- ================================

INSERT INTO permission_catalog (permission_key, label, description, category, is_active)
VALUES
  ('workorder.create', '작업지시서 생성', '작업지시서를 생성할 수 있다.', 'workorder', true),
  ('workorder.edit', '작업지시서 수정', '작업지시서 기본 정보를 수정할 수 있다.', 'workorder', true),
  ('workorder.request_review', '검토요청', '작업지시서 검토요청을 할 수 있다.', 'workorder', true),
  ('workorder.skip_review', '검토 생략', '검토요청 없이 다음 단계로 진행할 수 있다.', 'workorder', true),
  ('workorder.request_order', '발주요청', '발주요청 액션을 실행할 수 있다.', 'workorder', true),
  ('workorder.inspect', '검수', '검수 단계의 확인 액션을 실행할 수 있다.', 'workorder', true),
  ('workorder.complete', '완료', '작업지시서를 완료 처리할 수 있다.', 'workorder', true),
  ('inventory.manage', '재고 관리', '재고 데이터를 관리할 수 있다.', 'inventory', true),
  ('partner.manage', '거래처 관리', '거래처/공장/외주처 기준정보를 관리할 수 있다.', 'partner', true),
  ('member.invite', '멤버 초대', '고객사 멤버를 초대할 수 있다.', 'member', true),
  ('billing.manage', '요금제 관리', '고객사 요금제와 과금 관련 설정을 관리할 수 있다.', 'billing', true),
  ('storage.manage', '저장공간 관리', '고객사 저장공간 정책과 삭제 요청을 관리할 수 있다.', 'storage', true),
  ('stats.view', '통계 조회', '고객사 통계를 조회할 수 있다.', 'stats', true),
  ('system.audit.view', '시스템 감사 로그 조회', '시스템관리자 감사 로그를 조회할 수 있다.', 'system', true)
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ================================
-- 9. 기본 role permission seed
-- ================================

INSERT INTO role_permissions (role, permission_key, is_enabled)
VALUES
  ('admin', 'workorder.create', true),
  ('admin', 'workorder.edit', true),
  ('admin', 'workorder.request_review', true),
  ('admin', 'workorder.skip_review', true),
  ('admin', 'workorder.request_order', true),
  ('admin', 'workorder.inspect', true),
  ('admin', 'workorder.complete', true),
  ('admin', 'inventory.manage', true),
  ('admin', 'partner.manage', true),
  ('admin', 'member.invite', true),
  ('admin', 'billing.manage', false),
  ('admin', 'storage.manage', true),
  ('admin', 'stats.view', true),

  ('designer', 'workorder.create', true),
  ('designer', 'workorder.edit', true),
  ('designer', 'workorder.request_review', true),
  ('designer', 'workorder.skip_review', false),
  ('designer', 'workorder.request_order', false),
  ('designer', 'workorder.inspect', false),
  ('designer', 'workorder.complete', false),
  ('designer', 'inventory.manage', false),
  ('designer', 'partner.manage', false),
  ('designer', 'member.invite', false),
  ('designer', 'storage.manage', false),
  ('designer', 'stats.view', false),

  ('inspector', 'workorder.create', false),
  ('inspector', 'workorder.edit', false),
  ('inspector', 'workorder.request_review', false),
  ('inspector', 'workorder.skip_review', false),
  ('inspector', 'workorder.request_order', false),
  ('inspector', 'workorder.inspect', true),
  ('inspector', 'workorder.complete', true),
  ('inspector', 'inventory.manage', false),
  ('inspector', 'partner.manage', false),
  ('inspector', 'member.invite', false),
  ('inspector', 'storage.manage', false),
  ('inspector', 'stats.view', false),

  ('inventory_manager', 'workorder.create', false),
  ('inventory_manager', 'workorder.edit', false),
  ('inventory_manager', 'inventory.manage', true),
  ('inventory_manager', 'partner.manage', false),
  ('inventory_manager', 'stats.view', false),

  ('viewer', 'stats.view', true)
ON CONFLICT (role, permission_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

-- ================================
-- 10. 시스템관리자 permission seed
-- ================================

INSERT INTO system_permission_catalog (permission_key, label, description, category, is_active)
VALUES
  ('system.company.manage', '고객사 관리', '시스템관리자가 고객사를 관리할 수 있다.', 'company', true),
  ('system.company.invite_admin', '고객관리자 초대', '시스템관리자가 고객사 관리자를 초대할 수 있다.', 'invite', true),
  ('system.plan.manage', '요금제 관리', '시스템관리자가 고객사 요금제와 용량 정책을 관리할 수 있다.', 'billing', true),
  ('system.storage.manage', '저장공간 관리', '시스템관리자가 고객사 저장공간 정책을 관리할 수 있다.', 'storage', true),
  ('system.stats.view', '시스템 통계 조회', '시스템관리자가 전체 통계를 조회할 수 있다.', 'stats', true),
  ('system.audit.view', '감사 로그 조회', '시스템관리자가 감사 로그를 조회할 수 있다.', 'audit', true)
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ================================
-- 11. 향후 company_id 보강 체크용 주석
-- ================================
--
-- 아래 업무 테이블은 실제 적용 전에 현재 운영 SQL과 컬럼 존재 여부를 다시 확인해야 한다.
-- 이번 패치에서는 임의 ALTER를 실행하지 않는다.
--
-- 대상:
-- - spec_sheets
-- - partners
-- - attachments
-- - memos
-- - history_logs
-- - material_stocks
-- - spec_sheet_materials
-- - spec_sheet_outsourcing_lines
-- - outsourcing_processes
-- - units
-- - item_categories
--
-- 원칙:
-- - company_id 추가는 별도 migration에서 수행한다.
-- - 기존 데이터 backfill 전략 없이 NOT NULL 제약을 먼저 걸지 않는다.
-- - repository scope 적용과 함께 진행한다.

COMMIT;
