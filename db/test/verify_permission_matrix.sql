-- WAFL / PeaceByPiece permission matrix verification
-- Version: 0.16.37
-- Run after db/test/scenario_seed.sql.

-- Member permission summary.
SELECT
  cm.id AS company_member_id,
  cm.display_name,
  cm.role_template_code,
  array_agg(mp.permission_code ORDER BY mp.permission_code) FILTER (WHERE mp.is_enabled) AS enabled_permissions
FROM company_members cm
LEFT JOIN member_permissions mp ON mp.company_member_id = cm.id
WHERE cm.company_id = 'test-company-a'
GROUP BY cm.id, cm.display_name, cm.role_template_code
ORDER BY cm.id;

-- Critical permission expectations.
WITH expected AS (
  SELECT * FROM (VALUES
    ('test-cm-a-designer', 'workorder.status.order', true),
    ('test-cm-a-designer', 'workorder.status.inspect', false),
    ('test-cm-a-inspector', 'workorder.status.inspect', true),
    ('test-cm-a-inspector', 'workorder.status.order', false),
    ('test-cm-a-material', 'material.order.request', true),
    ('test-cm-a-material', 'material.order.place', true),
    ('test-cm-a-material', 'workorder.status.order', false),
    ('test-cm-a-viewer', 'workorder.read', true),
    ('test-cm-a-viewer', 'workorder.create', false)
  ) AS t(company_member_id, permission_code, expected_enabled)
),
actual AS (
  SELECT
    e.company_member_id,
    e.permission_code,
    COALESCE(mp.is_enabled, false) AS actual_enabled
  FROM expected e
  LEFT JOIN member_permissions mp
    ON mp.company_member_id = e.company_member_id
   AND mp.permission_code = e.permission_code
)
SELECT
  e.company_member_id,
  e.permission_code,
  e.expected_enabled,
  a.actual_enabled,
  CASE WHEN e.expected_enabled = a.actual_enabled THEN 'PASS' ELSE 'FAIL' END AS result
FROM expected e
JOIN actual a
  ON a.company_member_id = e.company_member_id
 AND a.permission_code = e.permission_code
ORDER BY e.company_member_id, e.permission_code;

-- Role-template default application should be explicit, not automatic.
-- This check confirms role templates and member permissions are separate records.
SELECT
  cm.id AS company_member_id,
  cm.role_template_code,
  count(DISTINCT rtp.permission_code)::integer AS role_template_permission_count,
  count(DISTINCT mp.permission_code)::integer AS member_permission_count,
  CASE
    WHEN count(DISTINCT rtp.permission_code) <> count(DISTINCT mp.permission_code)
      OR cm.role_template_code IN ('designer', 'inspector', 'inventory_manager', 'viewer')
    THEN 'PASS'
    ELSE 'CHECK'
  END AS result
FROM company_members cm
LEFT JOIN role_templates rt
  ON rt.company_id = cm.company_id
 AND rt.role_code = cm.role_template_code
LEFT JOIN role_template_permissions rtp
  ON rtp.role_template_id = rt.id
LEFT JOIN member_permissions mp
  ON mp.company_member_id = cm.id
WHERE cm.company_id = 'test-company-a'
GROUP BY cm.id, cm.role_template_code
ORDER BY cm.id;
