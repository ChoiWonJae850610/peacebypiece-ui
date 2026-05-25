-- WAFL / PeaceByPiece Google-login test seed verification
-- Version: 0.16.43
-- Purpose:
--   Verify that db/test/scenario_google_login_seed.sql has one real Gmail bridge
--   user that can enter the app immediately and open /dev/test-console.
--   Optional fixture users may remain as @example.invalid records because the
--   dev test console can switch to them after the real Gmail login succeeds.
--
-- Expected usage:
--   Run after db/test/scenario_seed.sql and db/test/scenario_google_login_seed.sql.
--
-- Reading the output:
--   - required_admin_ready_count must be 1.
--   - duplicate_configured_email_count must be 0.
--   - missing_membership_count must be 0.
--   - access_blocker_count must be 0.
--   - google_sub_linked_count is 0 before first browser login and increases after
--     the configured Gmail account completes Google login.

WITH target_users AS (
  SELECT *
  FROM (VALUES
    ('test-a-admin',     'TEST A 관리자',   'company_admin',     'test-company-a', true),
    ('test-a-designer',  'TEST A 디자이너', 'designer',          'test-company-a', false),
    ('test-a-inspector', 'TEST A 검수담당', 'inspector',         'test-company-a', false),
    ('test-a-material',  'TEST A 자재담당', 'inventory_manager', 'test-company-a', false),
    ('test-a-viewer',    'TEST A 조회전용', 'viewer',            'test-company-a', false),
    ('test-b-admin',     'TEST B 관리자',   'company_admin',     'test-company-b', false),
    ('test-b-designer',  'TEST B 디자이너', 'designer',          'test-company-b', false)
  ) AS seed(user_id, expected_name, expected_role_template_code, expected_company_id, is_required_login_user)
), rows AS (
  SELECT
    target.user_id,
    target.expected_name,
    target.expected_role_template_code,
    target.expected_company_id,
    target.is_required_login_user,
    u.email,
    u.google_sub,
    u.google_picture_url,
    u.last_login_at,
    u.is_active AS user_is_active,
    c.id AS company_id,
    c.name AS company_name,
    c.is_active AS company_is_active,
    c.onboarding_status,
    c.subscription_status,
    c.billing_status,
    c.postal_code,
    c.road_address,
    c.address_detail,
    c.requested_plan_code,
    cm.id AS company_member_id,
    cm.status AS member_status,
    cm.role_template_code,
    cm.company_id AS member_company_id,
    cu.id AS company_user_id,
    cu.is_active AS company_user_is_active,
    CASE
      WHEN u.email IS NULL THEN false
      WHEN u.email LIKE 'TEST\_%' ESCAPE '\' THEN false
      WHEN u.email LIKE '%@example.invalid' THEN false
      WHEN u.email LIKE '%@gmail.example' THEN false
      ELSE true
    END AS is_configured_real_email
  FROM target_users target
  LEFT JOIN users u ON u.id = target.user_id
  LEFT JOIN companies c ON c.id = target.expected_company_id
  LEFT JOIN company_members cm ON cm.user_id = u.id AND cm.company_id = target.expected_company_id
  LEFT JOIN company_users cu ON cu.user_id = u.id AND cu.company_id = target.expected_company_id
), duplicate_configured_emails AS (
  SELECT lower(email) AS email, COUNT(*) AS use_count
  FROM rows
  WHERE is_configured_real_email = true
  GROUP BY lower(email)
  HAVING COUNT(*) > 1
), pending_join_requests AS (
  SELECT jr.id
  FROM join_requests jr
  JOIN rows ON rows.is_configured_real_email = true
    AND lower(jr.applicant_email) = lower(rows.email)
  WHERE jr.status = 'pending'
)
SELECT
  COUNT(*) FILTER (WHERE user_id = 'test-a-admin' AND is_configured_real_email = true) AS required_admin_ready_count,
  COUNT(*) FILTER (WHERE is_configured_real_email = true) AS configured_real_email_count,
  (SELECT COUNT(*) FROM duplicate_configured_emails) AS duplicate_configured_email_count,
  COUNT(*) FILTER (WHERE company_member_id IS NULL OR member_status <> 'approved') AS missing_membership_count,
  COUNT(*) FILTER (WHERE company_user_id IS NULL OR company_user_is_active IS NOT TRUE) AS missing_company_user_count,
  COUNT(*) FILTER (WHERE member_company_id IS DISTINCT FROM expected_company_id) AS company_mismatch_count,
  COUNT(*) FILTER (WHERE role_template_code IS DISTINCT FROM expected_role_template_code) AS role_template_mismatch_count,
  COUNT(*) FILTER (
    WHERE is_required_login_user = true
      AND (
        user_is_active IS NOT TRUE
        OR company_is_active IS NOT TRUE
        OR onboarding_status <> 'active'
        OR subscription_status NOT IN ('trialing', 'active')
        OR member_status <> 'approved'
        OR postal_code IS NULL
        OR road_address IS NULL
        OR address_detail IS NULL
        OR requested_plan_code IS NULL
      )
  ) + (SELECT COUNT(*) FROM pending_join_requests) AS access_blocker_count,
  COUNT(*) FILTER (WHERE is_configured_real_email = true AND google_sub IS NOT NULL) AS google_sub_linked_count,
  COUNT(*) AS target_user_count
FROM rows;

WITH target_users AS (
  SELECT *
  FROM (VALUES
    ('test-a-admin',     'TEST A 관리자',   'company_admin',     'test-company-a', true),
    ('test-a-designer',  'TEST A 디자이너', 'designer',          'test-company-a', false),
    ('test-a-inspector', 'TEST A 검수담당', 'inspector',         'test-company-a', false),
    ('test-a-material',  'TEST A 자재담당', 'inventory_manager', 'test-company-a', false),
    ('test-a-viewer',    'TEST A 조회전용', 'viewer',            'test-company-a', false),
    ('test-b-admin',     'TEST B 관리자',   'company_admin',     'test-company-b', false),
    ('test-b-designer',  'TEST B 디자이너', 'designer',          'test-company-b', false)
  ) AS seed(user_id, expected_name, expected_role_template_code, expected_company_id, is_required_login_user)
), rows AS (
  SELECT
    target.user_id,
    target.expected_name,
    target.expected_role_template_code,
    target.expected_company_id,
    target.is_required_login_user,
    u.email,
    u.google_sub,
    u.last_login_at,
    u.is_active AS user_is_active,
    c.is_active AS company_is_active,
    c.onboarding_status,
    c.subscription_status,
    c.billing_status,
    c.postal_code,
    c.road_address,
    c.address_detail,
    c.requested_plan_code,
    cm.id AS company_member_id,
    cm.status AS member_status,
    cm.role_template_code,
    cm.company_id AS member_company_id,
    cu.id AS company_user_id,
    cu.is_active AS company_user_is_active,
    (
      SELECT COUNT(*)
      FROM join_requests jr
      WHERE u.email IS NOT NULL
        AND lower(jr.applicant_email) = lower(u.email)
        AND jr.status = 'pending'
    ) AS pending_join_request_count,
    CASE
      WHEN u.email IS NULL THEN false
      WHEN u.email LIKE 'TEST\_%' ESCAPE '\' THEN false
      WHEN u.email LIKE '%@example.invalid' THEN false
      WHEN u.email LIKE '%@gmail.example' THEN false
      ELSE true
    END AS is_configured_real_email
  FROM target_users target
  LEFT JOIN users u ON u.id = target.user_id
  LEFT JOIN companies c ON c.id = target.expected_company_id
  LEFT JOIN company_members cm ON cm.user_id = u.id AND cm.company_id = target.expected_company_id
  LEFT JOIN company_users cu ON cu.user_id = u.id AND cu.company_id = target.expected_company_id
)
SELECT
  rows.user_id,
  rows.expected_name,
  rows.email,
  rows.expected_company_id,
  rows.company_member_id,
  rows.member_status,
  rows.role_template_code,
  rows.onboarding_status,
  rows.subscription_status,
  rows.postal_code,
  rows.road_address,
  rows.address_detail,
  rows.requested_plan_code,
  rows.pending_join_request_count,
  CASE
    WHEN rows.company_member_id IS NULL THEN 'MEMBERSHIP_MISSING'
    WHEN rows.member_status <> 'approved' THEN 'MEMBERSHIP_NOT_APPROVED'
    WHEN rows.member_company_id IS DISTINCT FROM rows.expected_company_id THEN 'COMPANY_MISMATCH'
    WHEN rows.role_template_code IS DISTINCT FROM rows.expected_role_template_code THEN 'ROLE_TEMPLATE_MISMATCH'
    WHEN rows.company_is_active IS NOT TRUE THEN 'COMPANY_INACTIVE'
    WHEN rows.onboarding_status <> 'active' THEN 'COMPANY_NOT_ACTIVE'
    WHEN rows.subscription_status NOT IN ('trialing', 'active') THEN 'SUBSCRIPTION_BLOCKED'
    WHEN rows.postal_code IS NULL OR rows.road_address IS NULL OR rows.address_detail IS NULL OR rows.requested_plan_code IS NULL THEN 'COMPANY_PROFILE_INCOMPLETE'
    WHEN rows.pending_join_request_count > 0 THEN 'PENDING_JOIN_REQUEST_BLOCKER'
    WHEN rows.is_configured_real_email = false THEN 'DEV_CONSOLE_FIXTURE_ONLY'
    WHEN rows.google_sub IS NULL THEN 'READY_FOR_FIRST_GOOGLE_LOGIN'
    ELSE 'GOOGLE_LOGIN_LINKED'
  END AS verification_status,
  rows.last_login_at
FROM rows
ORDER BY rows.expected_company_id, rows.user_id;
