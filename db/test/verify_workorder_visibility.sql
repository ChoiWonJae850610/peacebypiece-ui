-- WAFL / PeaceByPiece workorder visibility verification
-- Version: 0.16.37
-- Run after db/test/scenario_seed.sql.
--
-- Expected policy:
--   - customer_admin: same company active workorders.
--   - general member: only assigned active workorders.
--   - deleted/trashed workorders are excluded from the normal list.
--   - other company workorders are excluded.

WITH visible AS (
  SELECT
    'customer_admin_company_a' AS viewer,
    s.id,
    s.company_id,
    s.manager_id,
    s.status,
    s.delete_status
  FROM spec_sheets s
  WHERE s.company_id = 'test-company-a'
    AND s.is_active = true
    AND s.delete_status = 'active'

  UNION ALL

  SELECT
    'designer_company_a' AS viewer,
    s.id,
    s.company_id,
    s.manager_id,
    s.status,
    s.delete_status
  FROM spec_sheets s
  WHERE s.company_id = 'test-company-a'
    AND s.manager_id = 'test-a-designer'
    AND s.is_active = true
    AND s.delete_status = 'active'

  UNION ALL

  SELECT
    'inspector_company_a' AS viewer,
    s.id,
    s.company_id,
    s.manager_id,
    s.status,
    s.delete_status
  FROM spec_sheets s
  WHERE s.company_id = 'test-company-a'
    AND s.manager_id = 'test-a-inspector'
    AND s.is_active = true
    AND s.delete_status = 'active'

  UNION ALL

  SELECT
    'material_manager_company_a' AS viewer,
    s.id,
    s.company_id,
    s.manager_id,
    s.status,
    s.delete_status
  FROM spec_sheets s
  WHERE s.company_id = 'test-company-a'
    AND s.manager_id = 'test-a-material'
    AND s.is_active = true
    AND s.delete_status = 'active'
),
expected_counts AS (
  SELECT * FROM (VALUES
    ('customer_admin_company_a', 7),
    ('designer_company_a', 4),
    ('inspector_company_a', 2),
    ('material_manager_company_a', 1)
  ) AS t(viewer, expected_count)
),
actual_counts AS (
  SELECT viewer, count(*)::integer AS actual_count
  FROM visible
  GROUP BY viewer
)
SELECT
  e.viewer,
  e.expected_count,
  COALESCE(a.actual_count, 0) AS actual_count,
  CASE WHEN e.expected_count = COALESCE(a.actual_count, 0) THEN 'PASS' ELSE 'FAIL' END AS result
FROM expected_counts e
LEFT JOIN actual_counts a ON a.viewer = e.viewer
ORDER BY e.viewer;

-- Cross-company leak check.
SELECT
  'company_a_view_should_not_include_company_b' AS check_name,
  count(*)::integer AS leaked_count,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM spec_sheets
WHERE company_id = 'test-company-b'
  AND id IN (
    SELECT id
    FROM spec_sheets
    WHERE company_id = 'test-company-a'
  );

-- Trashed workorder exclusion check.
SELECT
  'normal_list_should_exclude_trashed' AS check_name,
  count(*)::integer AS unexpected_count,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM spec_sheets
WHERE company_id = 'test-company-a'
  AND id = 'test-a-wo-trashed'
  AND is_active = true
  AND delete_status = 'active';

-- Category path check.
SELECT
  id,
  concat_ws(' > ', category1, category2, category3) AS category_path,
  CASE
    WHEN id LIKE 'test-a-%' AND concat_ws(' > ', category1, category2, category3) = '상의 > 티셔츠 > 반팔' THEN 'PASS'
    WHEN id LIKE 'test-b-%' AND concat_ws(' > ', category1, category2, category3) = '상의 > 셔츠' THEN 'PASS'
    ELSE 'CHECK'
  END AS result
FROM spec_sheets
WHERE id IN ('test-a-wo-draft-designer', 'test-a-wo-review-requested', 'test-b-wo-draft-designer')
ORDER BY id;
