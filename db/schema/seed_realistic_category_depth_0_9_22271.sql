-- PeaceByPiece realistic seed category-depth correction
-- Version: 0.9.22271
-- Purpose:
--   Existing 0.9.2227 realistic seed already stores category1_id/category2_id/category3_id.
--   This patch adds explicit payload labels for dashboard/debugging and verifies that
--   product type statistics can be grouped by category depth.
--
-- Recommended execution after applying 0.9.22271 patch:
--   1) If realistic seed is already loaded:
--      db/schema/seed_realistic_category_depth_0_9_22271.sql
--
--   2) If resetting from scratch:
--      db/schema/full_reset.sql
--      db/schema/full_reset_smoke_test.sql
--      db/schema/seed_realistic_workorders_0_9_2227.sql
--      db/schema/seed_realistic_category_depth_0_9_22271.sql

BEGIN;

UPDATE spec_sheets s
   SET payload = COALESCE(s.payload, '{}'::jsonb)
     || jsonb_build_object(
          'category1Label', COALESCE(NULLIF(c1.name, ''), '분류 미지정'),
          'category2Label', COALESCE(NULLIF(c2.name, ''), '분류 미지정'),
          'category3Label', COALESCE(NULLIF(c3.name, ''), '분류 미지정'),
          'categoryDepthPreset', '0.9.22271'
        ),
       updated_at = s.updated_at
  FROM item_categories c1
  LEFT JOIN item_categories c2
    ON c2.company_id = c1.company_id
  LEFT JOIN item_categories c3
    ON c3.company_id = c1.company_id
 WHERE s.company_id = 'company-sample-customer'
   AND s.id LIKE 'realistic-spec-%'
   AND c1.id = s.category1_id
   AND c1.company_id = s.company_id
   AND c2.id = s.category2_id
   AND c3.id = s.category3_id;

COMMIT;

WITH category_depth_rows AS (
  SELECT '대분류' AS depth_label,
         COALESCE(NULLIF(c1.name, ''), NULLIF(s.payload->>'category1Label', ''), '분류 미지정') AS category_label
    FROM spec_sheets s
    LEFT JOIN item_categories c1 ON c1.id = s.category1_id AND c1.company_id = s.company_id
   WHERE s.company_id = 'company-sample-customer'
     AND s.id LIKE 'realistic-spec-%'
     AND s.deleted_at IS NULL
     AND COALESCE(s.is_active, true) = true
  UNION ALL
  SELECT '중분류' AS depth_label,
         COALESCE(NULLIF(c2.name, ''), NULLIF(s.payload->>'category2Label', ''), '분류 미지정') AS category_label
    FROM spec_sheets s
    LEFT JOIN item_categories c2 ON c2.id = s.category2_id AND c2.company_id = s.company_id
   WHERE s.company_id = 'company-sample-customer'
     AND s.id LIKE 'realistic-spec-%'
     AND s.deleted_at IS NULL
     AND COALESCE(s.is_active, true) = true
  UNION ALL
  SELECT '세분류' AS depth_label,
         COALESCE(NULLIF(c3.name, ''), NULLIF(s.payload->>'category3Label', ''), '분류 미지정') AS category_label
    FROM spec_sheets s
    LEFT JOIN item_categories c3 ON c3.id = s.category3_id AND c3.company_id = s.company_id
   WHERE s.company_id = 'company-sample-customer'
     AND s.id LIKE 'realistic-spec-%'
     AND s.deleted_at IS NULL
     AND COALESCE(s.is_active, true) = true
)
SELECT
  'realistic category depth 0.9.22271 applied' AS result,
  depth_label,
  category_label,
  COUNT(*) AS count_value
FROM category_depth_rows
WHERE category_label <> '분류 미지정'
GROUP BY depth_label, category_label
ORDER BY CASE depth_label WHEN '대분류' THEN 1 WHEN '중분류' THEN 2 ELSE 3 END, COUNT(*) DESC, category_label;
