-- WAFL / PeaceByPiece Google-login test seed bridge
-- Version: 0.16.41
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
--
-- Important:
--   - This file does not bypass Google login.
--   - Use only in development/test databases.
--   - Do not reuse the same Gmail address for multiple configured test users.
--   - The script clears google_sub only for configured real Gmail rows.
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
-- Then log in with the configured Gmail account and confirm that users.google_sub
-- is filled for the matching test user.
