-- WAFL / PeaceByPiece Google-login test seed verification
-- Version: 0.16.38
-- Purpose:
--   Verify that db/test/scenario_google_login_seed.sql is ready for browser
--   testing with real Gmail accounts.
--
-- Expected usage:
--   Run after db/test/scenario_seed.sql and db/test/scenario_google_login_seed.sql.
--
-- Reading the output:
--   - placeholder_remaining_count must be 0.
--   - duplicate_email_count must be 0.
--   - missing_membership_count must be 0.
--   - google_sub_linked_count is 0 before first browser login and increases after
--     each Gmail account completes Google login.

WITH target_users AS (
  SELECT *
  FROM (VALUES
    ('test-a-admin',     'TEST A 관리자',   'company_admin',     'test-company-a'),
    ('test-a-designer',  'TEST A 디자이너', 'designer',          'test-company-a'),
    ('test-a-inspector', 'TEST A 검수담당', 'inspector',         'test-company-a'),
    ('test-a-material',  'TEST A 자재담당', 'inventory_manager', 'test-company-a'),
    ('test-a-viewer',    'TEST A 조회전용', 'viewer',            'test-company-a'),
    ('test-b-admin',     'TEST B 관리자',   'company_admin',     'test-company-b'),
    ('test-b-designer',  'TEST B 디자이너', 'designer',          'test-company-b')
  ) AS seed(user_id, expected_name, expected_role_template_code, expected_company_id)
), rows AS (
  SELECT
    target.user_id,
    target.expected_name,
    target.expected_role_template_code,
    target.expected_company_id,
    u.email,
    u.google_sub,
    u.google_picture_url,
    u.last_login_at,
    cm.id AS company_member_id,
    cm.status AS member_status,
    cm.role_template_code,
    cm.company_id AS member_company_id
  FROM target_users target
  LEFT JOIN users u ON u.id = target.user_id
  LEFT JOIN company_members cm ON cm.user_id = u.id AND cm.company_id = target.expected_company_id
), duplicate_emails AS (
  SELECT lower(email) AS email, COUNT(*) AS use_count
  FROM users
  WHERE id LIKE 'test-%'
    AND email IS NOT NULL
  GROUP BY lower(email)
  HAVING COUNT(*) > 1
)
SELECT
  COUNT(*) FILTER (WHERE email LIKE 'TEST\_%' ESCAPE '\' OR email LIKE '%@example.invalid') AS placeholder_remaining_count,
  (SELECT COUNT(*) FROM duplicate_emails) AS duplicate_email_count,
  COUNT(*) FILTER (WHERE company_member_id IS NULL OR member_status <> 'approved') AS missing_membership_count,
  COUNT(*) FILTER (WHERE member_company_id IS DISTINCT FROM expected_company_id) AS company_mismatch_count,
  COUNT(*) FILTER (WHERE role_template_code IS DISTINCT FROM expected_role_template_code) AS role_template_mismatch_count,
  COUNT(*) FILTER (WHERE google_sub IS NOT NULL) AS google_sub_linked_count,
  COUNT(*) AS target_user_count
FROM rows;

SELECT
  rows.user_id,
  rows.expected_name,
  rows.email,
  rows.expected_company_id,
  rows.company_member_id,
  rows.member_status,
  rows.role_template_code,
  CASE
    WHEN rows.email LIKE 'TEST\_%' ESCAPE '\' OR rows.email LIKE '%@example.invalid' THEN 'PLACEHOLDER_REMAINING'
    WHEN rows.company_member_id IS NULL THEN 'MEMBERSHIP_MISSING'
    WHEN rows.member_status <> 'approved' THEN 'MEMBERSHIP_NOT_APPROVED'
    WHEN rows.member_company_id IS DISTINCT FROM rows.expected_company_id THEN 'COMPANY_MISMATCH'
    WHEN rows.role_template_code IS DISTINCT FROM rows.expected_role_template_code THEN 'ROLE_TEMPLATE_MISMATCH'
    WHEN rows.google_sub IS NULL THEN 'READY_FOR_FIRST_GOOGLE_LOGIN'
    ELSE 'GOOGLE_LOGIN_LINKED'
  END AS verification_status,
  rows.last_login_at
FROM (
  SELECT
    target.user_id,
    target.expected_name,
    target.expected_role_template_code,
    target.expected_company_id,
    u.email,
    u.google_sub,
    u.last_login_at,
    cm.id AS company_member_id,
    cm.status AS member_status,
    cm.role_template_code,
    cm.company_id AS member_company_id
  FROM (
    VALUES
      ('test-a-admin',     'TEST A 관리자',   'company_admin',     'test-company-a'),
      ('test-a-designer',  'TEST A 디자이너', 'designer',          'test-company-a'),
      ('test-a-inspector', 'TEST A 검수담당', 'inspector',         'test-company-a'),
      ('test-a-material',  'TEST A 자재담당', 'inventory_manager', 'test-company-a'),
      ('test-a-viewer',    'TEST A 조회전용', 'viewer',            'test-company-a'),
      ('test-b-admin',     'TEST B 관리자',   'company_admin',     'test-company-b'),
      ('test-b-designer',  'TEST B 디자이너', 'designer',          'test-company-b')
  ) AS target(user_id, expected_name, expected_role_template_code, expected_company_id)
  LEFT JOIN users u ON u.id = target.user_id
  LEFT JOIN company_members cm ON cm.user_id = u.id AND cm.company_id = target.expected_company_id
) rows
ORDER BY rows.expected_company_id, rows.user_id;
