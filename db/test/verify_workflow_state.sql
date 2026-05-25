-- WAFL / PeaceByPiece workflow state verification
-- Version: 0.16.45
-- Run after db/test/scenario_seed.sql.

-- Fixture coverage by workflow state.
SELECT
  status,
  count(*)::integer AS fixture_count
FROM spec_sheets
WHERE company_id = 'test-company-a'
  AND delete_status = 'active'
GROUP BY status
ORDER BY status;

-- Expected button-policy hints for manual UI verification.
SELECT
  s.id,
  s.title,
  s.status,
  s.manager_id,
  CASE
    WHEN s.status = 'draft' AND s.manager_id = 'test-a-designer' THEN 'designer: 검토요청 가능 / 발주권한 있으면 발주요청 가능'
    WHEN s.status = 'review_requested' AND s.manager_id = 'test-a-designer' THEN 'designer: 검토요청 후에는 발주요청 버튼 숨김'
    WHEN s.status = 'review_completed' AND s.manager_id = 'test-a-designer' THEN 'designer: 발주권한 있으면 발주요청 가능'
    WHEN s.status = 'inspection' AND s.manager_id = 'test-a-inspector' THEN 'inspector: 검수 가능 권한일 때 검수 완료 가능'
    WHEN s.status = 'completed' THEN '완료 상태'
    WHEN s.status = 'rejected' THEN '반려 상태'
    ELSE '수동 확인'
  END AS expected_ui_policy
FROM spec_sheets s
WHERE s.company_id = 'test-company-a'
  AND s.delete_status = 'active'
ORDER BY
  CASE s.status
    WHEN 'draft' THEN 1
    WHEN 'review_requested' THEN 2
    WHEN 'review_completed' THEN 3
    WHEN 'inspection' THEN 4
    WHEN 'completed' THEN 5
    WHEN 'rejected' THEN 6
    ELSE 99
  END,
  s.id;

-- Review request must not be treated as product inspection.
SELECT
  'review_requested_is_not_inspection' AS check_name,
  count(*)::integer AS unexpected_count,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM spec_sheets
WHERE company_id = 'test-company-a'
  AND status = 'review_requested'
  AND manager_id = 'test-a-inspector';

-- Product inspection fixture must be assigned to the inspector.
SELECT
  'inspection_assigned_to_inspector' AS check_name,
  count(*)::integer AS expected_one,
  CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM spec_sheets
WHERE id = 'test-a-wo-inspection'
  AND company_id = 'test-company-a'
  AND status = 'inspection'
  AND manager_id = 'test-a-inspector';


-- Factory partner linkage required by order-request confirmation.
SELECT
  'order_request_factory_partner_linked' AS check_name,
  count(*)::integer AS expected_one,
  CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM orders o
JOIN partners p
  ON p.id = o.factory_partner_id
 AND p.company_id = o.company_id
 AND p.is_active = true
WHERE o.id = 'test-a-order-review-completed'
  AND o.company_id = 'test-company-a'
  AND o.spec_sheet_id = 'test-a-wo-review-completed'
  AND o.factory_name = p.name;

-- Factory partner must have a factory capability item so /api/partners/factories can return it.
SELECT
  'active_factory_partner_item_available' AS check_name,
  count(*)::integer AS expected_one,
  CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM partners p
JOIN partner_items pi
  ON pi.partner_id = p.id
 AND pi.company_id = p.company_id
 AND pi.item_type = 'factory'
 AND pi.is_active = true
WHERE p.id = 'test-a-partner-factory'
  AND p.company_id = 'test-company-a'
  AND p.name = 'TEST A 봉제공장'
  AND p.is_active = true;
