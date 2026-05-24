-- WAFL / PeaceByPiece Google-login test seed bridge
-- Version: 0.16.38
-- Purpose:
--   Connect deterministic DB test users from db/test/scenario_seed.sql to real Gmail
--   accounts so the current Google OAuth login flow can be tested in a browser.
--
-- Required order:
--   1) Apply db/schema/full_reset.sql in a development/test database.
--   2) Apply db/test/scenario_seed.sql.
--   3) Edit the email placeholders below to real Gmail addresses.
--   4) Apply this file.
--   5) Log in with each Gmail account. On first login, the app links google_sub.
--
-- Important:
--   - This file does not bypass Google login.
--   - Use only in development/test databases.
--   - Do not reuse the same Gmail address for multiple test users.
--   - The script clears google_sub for these deterministic test users so a fresh
--     local test DB can link each user to the selected Gmail account on login.
--   - Do not run this file against production data.

BEGIN;

CREATE TEMP TABLE _wafl_google_login_test_users (
  user_id text PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL
) ON COMMIT DROP;

INSERT INTO _wafl_google_login_test_users (user_id, email, display_name)
VALUES
  ('test-a-admin',     'TEST_CUSTOMER_ADMIN_EMAIL@gmail.com',     'TEST A 관리자'),
  ('test-a-designer',  'TEST_DESIGNER_EMAIL@gmail.com',           'TEST A 디자이너'),
  ('test-a-inspector', 'TEST_INSPECTOR_EMAIL@gmail.com',          'TEST A 검수담당'),
  ('test-a-material',  'TEST_MATERIAL_MANAGER_EMAIL@gmail.com',   'TEST A 자재담당'),
  ('test-a-viewer',    'TEST_VIEWER_EMAIL@gmail.com',             'TEST A 조회전용'),
  ('test-b-admin',     'TEST_COMPANY_B_ADMIN_EMAIL@gmail.com',    'TEST B 관리자'),
  ('test-b-designer',  'TEST_COMPANY_B_DESIGNER_EMAIL@gmail.com', 'TEST B 디자이너');

DO $$
DECLARE
  placeholder_count integer;
  duplicate_count integer;
  missing_user_count integer;
BEGIN
  SELECT COUNT(*)
    INTO placeholder_count
  FROM _wafl_google_login_test_users
  WHERE email LIKE 'TEST\_%' ESCAPE '\'
     OR email LIKE '%@example.invalid'
     OR email LIKE '%@gmail.example';

  IF placeholder_count > 0 THEN
    RAISE EXCEPTION 'Replace all TEST_* Gmail placeholders before running db/test/scenario_google_login_seed.sql.';
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
    RAISE EXCEPTION 'Each test user must use a different Gmail address in db/test/scenario_google_login_seed.sql.';
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

UPDATE users u
SET
  email = lower(seed.email),
  name = seed.display_name,
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
-- Then log in with each configured Gmail account and confirm that users.google_sub
-- is filled for the matching test user.
