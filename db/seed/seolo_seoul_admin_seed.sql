-- =========================================
-- WAFL Seolo Seoul 관리자 테스트 seed
-- =========================================
-- 사용 전 아래 google_sub/google_email/google_name 값을 실제 관리자 Google 계정 기준으로 바꿔도 됩니다.

BEGIN;

INSERT INTO companies (
  id,
  name,
  business_name,
  memo,
  is_active,
  billing_status,
  status,
  plan_code,
  member_limit,
  storage_limit_bytes
)
VALUES (
  'company-seolo-seoul',
  'Seolo Seoul',
  'Seolo Seoul',
  'WAFL 테스트 고객사',
  true,
  'trial',
  'active',
  'basic',
  10,
  1073741824
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  business_name = EXCLUDED.business_name,
  memo = EXCLUDED.memo,
  is_active = true,
  billing_status = EXCLUDED.billing_status,
  status = EXCLUDED.status,
  plan_code = EXCLUDED.plan_code,
  member_limit = EXCLUDED.member_limit,
  storage_limit_bytes = EXCLUDED.storage_limit_bytes,
  updated_at = now();

INSERT INTO users (
  id,
  company_id,
  email,
  name,
  role,
  google_sub,
  google_picture_url,
  phone,
  phone_source,
  birthday,
  birthday_source,
  is_active,
  last_login_at
)
VALUES (
  'user-seolo-seoul-admin',
  'company-seolo-seoul',
  'admin@seoloseoul.test',
  'Seolo Seoul Admin',
  'admin',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = true,
  last_login_at = now(),
  updated_at = now();

UPDATE companies
   SET owner_user_id = 'user-seolo-seoul-admin',
       updated_at = now()
 WHERE id = 'company-seolo-seoul';

INSERT INTO company_members (
  company_id,
  user_id,
  status,
  role_template_code,
  display_name,
  approved_by,
  approved_at
)
VALUES (
  'company-seolo-seoul',
  'user-seolo-seoul-admin',
  'approved',
  'company_admin',
  'Seolo Seoul Admin',
  'user-seolo-seoul-admin',
  now()
)
ON CONFLICT (company_id, user_id) DO UPDATE SET
  status = 'approved',
  role_template_code = 'company_admin',
  display_name = EXCLUDED.display_name,
  approved_by = EXCLUDED.approved_by,
  approved_at = COALESCE(company_members.approved_at, now()),
  updated_at = now();

INSERT INTO member_permissions (company_member_id, permission_code, is_enabled, granted_by, granted_at)
SELECT
  cm.id,
  p.permission_code,
  true,
  'user-seolo-seoul-admin',
  now()
FROM company_members cm
JOIN role_templates rt
  ON rt.role_code = 'company_admin'
 AND rt.company_id IS NULL
JOIN role_template_permissions p
  ON p.role_template_id = rt.id
 AND p.is_enabled = true
WHERE cm.company_id = 'company-seolo-seoul'
  AND cm.user_id = 'user-seolo-seoul-admin'
ON CONFLICT (company_member_id, permission_code) DO UPDATE SET
  is_enabled = true,
  granted_by = EXCLUDED.granted_by,
  granted_at = now(),
  updated_at = now();

COMMIT;
