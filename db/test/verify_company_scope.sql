-- WAFL / PeaceByPiece company-scope verification
-- Version: 0.16.37
-- Run after db/test/scenario_seed.sql.

-- Workorders must be scoped to their own company.
SELECT
  'workorders_company_scope' AS check_name,
  count(*)::integer AS cross_company_rows,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM spec_sheets s
JOIN users u ON u.id = s.manager_id
WHERE s.company_id <> u.company_id
  AND s.id LIKE 'test-%';

-- Orders must match their parent workorder company.
SELECT
  'orders_company_scope' AS check_name,
  count(*)::integer AS cross_company_rows,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM orders o
JOIN spec_sheets s ON s.id = o.spec_sheet_id
WHERE o.company_id <> s.company_id
  AND o.id LIKE 'test-%';

-- Material lines must match both workorder and material company.
SELECT
  'material_lines_company_scope' AS check_name,
  count(*)::integer AS cross_company_rows,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM workorder_material_lines wml
JOIN spec_sheets s ON s.id = wml.workorder_id
JOIN materials m ON m.id = wml.material_id
WHERE (wml.company_id <> s.company_id OR wml.company_id <> m.company_id)
  AND wml.id LIKE 'test-%';

-- Attachments and memos must match their parent workorder company.
SELECT
  'attachments_company_scope' AS check_name,
  count(*)::integer AS cross_company_rows,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM attachments a
JOIN spec_sheets s ON s.id = a.order_id
WHERE a.company_id <> s.company_id
  AND a.id LIKE 'test-%';

SELECT
  'memos_company_scope' AS check_name,
  count(*)::integer AS cross_company_rows,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM memos m
JOIN spec_sheets s ON s.id = m.order_id
WHERE m.company_id <> s.company_id
  AND m.id LIKE 'test-%';

-- Company B data should exist, but must remain isolated from Company A queries.
SELECT
  'company_b_fixture_exists_for_scope_test' AS check_name,
  count(*)::integer AS company_b_workorders,
  CASE WHEN count(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM spec_sheets
WHERE company_id = 'test-company-b'
  AND id LIKE 'test-b-%';
