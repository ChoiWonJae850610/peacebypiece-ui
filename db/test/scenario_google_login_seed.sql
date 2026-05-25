-- WAFL / PeaceByPiece Google-login test seed bridge
-- Version: 0.16.43
-- Purpose:
--   Connect at least one deterministic DB test user from db/test/scenario_seed.sql
--   to a real Gmail account so the current Google OAuth login flow can enter the
--   app and then use /dev/test-console for fixture-user switching.
--
-- Required order:
--   1) Apply db/schema/full_reset.sql in a development/test database.
--   2) Apply db/test/scenario_seed.sql.
--   3) Edit only TEST_CUSTOMER_ADMIN_EMAIL@gmail.com below to a real Gmail address.
--      The other TEST_* placeholders are optional and may remain unchanged.
--   4) Apply this file.
--   5) Log in with the configured Gmail account. On first login, the app links google_sub.
--   6) The configured Gmail must land directly in the approved TEST A customer admin session.
--
-- Important:
--   - This file does not bypass Google login.
--   - Use only in development/test databases.
--   - Do not reuse the same Gmail address for multiple configured test users.
--   - The script clears google_sub only for configured real Gmail rows.
--   - The required Gmail is forced to the approved TEST A company-admin fixture.
--   - Pending join requests for configured real Gmail addresses are cancelled so login
--     cannot be redirected to the approval-pending screen.
--   - Do not run this file against production data.

BEGIN;

CREATE TEMP TABLE _wafl_google_login_test_users (
  user_id text PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL,
  is_required boolean NOT NULL DEFAULT false
) ON COMMIT DROP;

INSERT INTO _wafl_google_login_test_users (user_id, email, display_name, is_required)
VALUES
  ('test-a-admin',     'TEST_CUSTOMER_ADMIN_EMAIL@gmail.com',     'TEST A 관리자',   true),
  ('test-a-designer',  'TEST_DESIGNER_EMAIL@gmail.com',           'TEST A 디자이너', false),
  ('test-a-inspector', 'TEST_INSPECTOR_EMAIL@gmail.com',          'TEST A 검수담당', false),
  ('test-a-material',  'TEST_MATERIAL_MANAGER_EMAIL@gmail.com',   'TEST A 자재담당', false),
  ('test-a-viewer',    'TEST_VIEWER_EMAIL@gmail.com',             'TEST A 조회전용', false),
  ('test-b-admin',     'TEST_COMPANY_B_ADMIN_EMAIL@gmail.com',    'TEST B 관리자',   false),
  ('test-b-designer',  'TEST_COMPANY_B_DESIGNER_EMAIL@gmail.com', 'TEST B 디자이너', false);

DELETE FROM _wafl_google_login_test_users
WHERE is_required = false
  AND (
    email LIKE 'TEST\_%' ESCAPE '\'
    OR email LIKE '%@example.invalid'
    OR email LIKE '%@gmail.example'
  );

DO $$
DECLARE
  required_placeholder_count integer;
  configured_count integer;
  duplicate_count integer;
  missing_user_count integer;
BEGIN
  SELECT COUNT(*)
    INTO required_placeholder_count
  FROM _wafl_google_login_test_users
  WHERE is_required = true
    AND (
      email LIKE 'TEST\_%' ESCAPE '\'
      OR email LIKE '%@example.invalid'
      OR email LIKE '%@gmail.example'
    );

  IF required_placeholder_count > 0 THEN
    RAISE EXCEPTION 'Replace TEST_CUSTOMER_ADMIN_EMAIL@gmail.com with one real Gmail address before running db/test/scenario_google_login_seed.sql.';
  END IF;

  SELECT COUNT(*)
    INTO configured_count
  FROM _wafl_google_login_test_users;

  IF configured_count < 1 THEN
    RAISE EXCEPTION 'Configure at least TEST_CUSTOMER_ADMIN_EMAIL@gmail.com before running db/test/scenario_google_login_seed.sql.';
  END IF;

  SELECT COUNT(*)
    INTO duplicate_count
  FROM (
    SELECT lower(email)
    FROM _wafl_google_login_test_users
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Each configured Gmail address must be unique in db/test/scenario_google_login_seed.sql.';
  END IF;

  SELECT COUNT(*)
    INTO missing_user_count
  FROM _wafl_google_login_test_users seed
  LEFT JOIN users u ON u.id = seed.user_id
  WHERE u.id IS NULL;

  IF missing_user_count > 0 THEN
    RAISE EXCEPTION 'Run db/test/scenario_seed.sql before db/test/scenario_google_login_seed.sql.';
  END IF;
END $$;

-- Keep the Google bridge account out of the approval-pending path. The local
-- dev test console requires one already-approved customer-admin session first.
UPDATE companies
SET
  onboarding_status = 'active',
  subscription_status = 'trialing',
  billing_status = 'trial',
  is_active = true,
  onboarding_completed_at = COALESCE(onboarding_completed_at, now()),
  trial_started_at = COALESCE(trial_started_at, now()),
  trial_ends_at = COALESCE(trial_ends_at, now() + interval '7 days'),
  english_name = COALESCE(NULLIF(english_name, ''), CASE id WHEN 'test-company-a' THEN 'TEST A CUSTOMER' WHEN 'test-company-b' THEN 'TEST B CUSTOMER' ELSE english_name END),
  business_name = COALESCE(NULLIF(business_name, ''), CASE id WHEN 'test-company-a' THEN 'TEST A 사업자' WHEN 'test-company-b' THEN 'TEST B 사업자' ELSE business_name END),
  business_registration_number = COALESCE(NULLIF(business_registration_number, ''), CASE id WHEN 'test-company-a' THEN '000-00-00001' WHEN 'test-company-b' THEN '000-00-00002' ELSE business_registration_number END),
  postal_code = COALESCE(NULLIF(postal_code, ''), '58328'),
  road_address = COALESCE(NULLIF(road_address, ''), CASE id WHEN 'test-company-a' THEN '전라남도 나주시 그린로 1' WHEN 'test-company-b' THEN '전라남도 나주시 그린로 2' ELSE road_address END),
  jibun_address = COALESCE(NULLIF(jibun_address, ''), CASE id WHEN 'test-company-a' THEN '전라남도 나주시 빛가람동 000' WHEN 'test-company-b' THEN '전라남도 나주시 빛가람동 001' ELSE jibun_address END),
  address_detail = COALESCE(NULLIF(address_detail, ''), CASE id WHEN 'test-company-a' THEN '205동 2202호' WHEN 'test-company-b' THEN '101동 101호' ELSE address_detail END),
  address_extra = COALESCE(NULLIF(address_extra, ''), '테스트 주소'),
  requested_plan_code = COALESCE(NULLIF(requested_plan_code, ''), 'basic'),
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT u.company_id
  FROM users u
  JOIN _wafl_google_login_test_users seed ON seed.user_id = u.id
);

UPDATE company_users cu
SET
  is_active = true,
  updated_at = now()
FROM _wafl_google_login_test_users seed
WHERE cu.user_id = seed.user_id;

UPDATE company_members cm
SET
  status = 'approved',
  approved_by = COALESCE(approved_by, 'test-a-admin'),
  approved_at = COALESCE(approved_at, now()),
  updated_at = now()
FROM _wafl_google_login_test_users seed
WHERE cm.user_id = seed.user_id;

UPDATE join_requests jr
SET
  status = 'cancelled',
  updated_at = now()
FROM _wafl_google_login_test_users seed
WHERE jr.status = 'pending'
  AND lower(jr.applicant_email) = lower(seed.email);

UPDATE users u
SET
  email = lower(seed.email),
  name = seed.display_name,
  phone = COALESCE(NULLIF(u.phone, ''), CASE seed.user_id
    WHEN 'test-a-admin' THEN '01000000001'
    WHEN 'test-a-designer' THEN '01000000002'
    WHEN 'test-a-inspector' THEN '01000000003'
    WHEN 'test-a-material' THEN '01000000004'
    WHEN 'test-a-viewer' THEN '01000000005'
    WHEN 'test-b-admin' THEN '01000000006'
    WHEN 'test-b-designer' THEN '01000000007'
    ELSE '01000000000'
  END),
  phone_source = COALESCE(u.phone_source, 'user'),
  google_sub = NULL,
  google_picture_url = NULL,
  last_login_at = NULL,
  updated_at = now()
FROM _wafl_google_login_test_users seed
WHERE u.id = seed.user_id;

UPDATE company_users cu
SET
  display_name = seed.display_name,
  updated_at = now()
FROM _wafl_google_login_test_users seed
WHERE cu.user_id = seed.user_id;

UPDATE company_members cm
SET
  display_name = seed.display_name,
  updated_at = now()
FROM _wafl_google_login_test_users seed
WHERE cm.user_id = seed.user_id;

COMMIT;

-- After applying this file, run:
--   db/test/verify_google_login_seed.sql
-- Then log in with the configured Gmail account and confirm that users.google_sub
-- is filled for the matching test user.
