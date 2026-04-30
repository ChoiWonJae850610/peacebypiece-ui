-- 0.8.0 user / permission DB structure
-- 사용자/권한 DB 구조를 실제 조회 repository와 연결하기 위한 기준 테이블 및 seed입니다.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_users (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'designer', 'inspector')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);

CREATE TABLE IF NOT EXISTS role_catalog (
  role TEXT PRIMARY KEY CHECK (role IN ('admin', 'designer', 'inspector')),
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permission_catalog (
  permission_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL REFERENCES role_catalog(role) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role, permission_key)
);

INSERT INTO role_catalog (role, label, description, sort_order, is_active)
VALUES
  ('admin', '관리자', '전체 승인과 비용, 권한 관리가 가능한 역할', 10, TRUE),
  ('designer', '디자이너', '작업지시 작성, 검토 요청, 발주 요청 중심 역할', 20, TRUE),
  ('inspector', '재고관리', '입고 등록, 검수 완료, 재고 수정 중심 역할', 30, TRUE)
ON CONFLICT (role) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO permission_catalog (permission_key, label, description)
VALUES
  ('canAssignRoles', '권한관리', '사용자 역할을 관리할 수 있는 권한'),
  ('canEditInventory', '재고수정', '입고, 차감, 보정 등 재고를 수정할 수 있는 권한'),
  ('canSeeCostSections', '원가조회', '공임, 원가, 비용 관련 영역을 볼 수 있는 권한'),
  ('canSeeProductionSections', '생산정보조회', '생산 관련 섹션을 볼 수 있는 권한'),
  ('canSeeInventoryHistorySection', '재고이력조회', '재고 변경 이력을 볼 수 있는 권한'),
  ('canSeeAttachments', '첨부조회', '작업지시서 첨부파일을 볼 수 있는 권한')
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO role_permissions (role, permission_key, is_enabled)
VALUES
  ('admin', 'canAssignRoles', TRUE),
  ('admin', 'canEditInventory', TRUE),
  ('admin', 'canSeeCostSections', TRUE),
  ('admin', 'canSeeProductionSections', TRUE),
  ('admin', 'canSeeInventoryHistorySection', TRUE),
  ('admin', 'canSeeAttachments', TRUE),
  ('designer', 'canAssignRoles', FALSE),
  ('designer', 'canEditInventory', FALSE),
  ('designer', 'canSeeCostSections', FALSE),
  ('designer', 'canSeeProductionSections', TRUE),
  ('designer', 'canSeeInventoryHistorySection', TRUE),
  ('designer', 'canSeeAttachments', TRUE),
  ('inspector', 'canAssignRoles', FALSE),
  ('inspector', 'canEditInventory', TRUE),
  ('inspector', 'canSeeCostSections', FALSE),
  ('inspector', 'canSeeProductionSections', FALSE),
  ('inspector', 'canSeeInventoryHistorySection', TRUE),
  ('inspector', 'canSeeAttachments', TRUE)
ON CONFLICT (role, permission_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_name = 'users'
       AND column_name = 'company_id'
  ) THEN
    INSERT INTO users (id, company_id, email, name, role, is_active)
    VALUES
      ('user-admin', 'company-sample-customer', 'admin@peacebypiece.local', '박관리', 'admin', TRUE),
      ('user-designer', 'company-sample-customer', 'designer@peacebypiece.local', '김디자이너', 'designer', TRUE),
      ('user-qc', 'company-sample-customer', 'inspector@peacebypiece.local', '이검수', 'inspector', TRUE)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  ELSE
    INSERT INTO users (id, email, name, is_active)
    VALUES
      ('user-admin', 'admin@peacebypiece.local', '박관리', TRUE),
      ('user-designer', 'designer@peacebypiece.local', '김디자이너', TRUE),
      ('user-qc', 'inspector@peacebypiece.local', '이검수', TRUE)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END IF;
END $$;

INSERT INTO company_users (id, company_id, user_id, role, is_active)
VALUES
  ('company-user-admin', 'company-sample-customer', 'user-admin', 'admin', TRUE),
  ('company-user-designer', 'company-sample-customer', 'user-designer', 'designer', TRUE),
  ('company-user-qc', 'company-sample-customer', 'user-qc', 'inspector', TRUE)
ON CONFLICT (company_id, user_id, role) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
