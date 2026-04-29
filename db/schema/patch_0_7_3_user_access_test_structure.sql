-- 0.7.3 user / permission test structure
-- 로그인 전환 전까지 관리자 환경설정의 사용자/권한 점검 패널과 맞춰 확인하는 최소 DB 구조입니다.

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

INSERT INTO company_users (id, company_id, user_id, role, is_active)
VALUES
  ('company-user-admin', 'company-demo', 'user-admin', 'admin', TRUE),
  ('company-user-designer', 'company-demo', 'user-designer', 'designer', TRUE),
  ('company-user-qc', 'company-demo', 'user-qc', 'inspector', TRUE)
ON CONFLICT (company_id, user_id, role) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
