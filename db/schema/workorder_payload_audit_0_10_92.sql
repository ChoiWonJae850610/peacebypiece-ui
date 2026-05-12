-- PeaceByPiece 0.10.92
-- 작업지시서 payload 제거 전 진단 SQL
-- schema/data 변경 없음. SELECT만 실행한다.

\echo '1) payload 컬럼 보유 테이블'
SELECT
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'payload'
ORDER BY table_name;

\echo '2) spec_sheets payload row 수와 크기'
SELECT
  COUNT(*)::integer AS spec_sheet_count,
  COUNT(*) FILTER (WHERE payload IS NOT NULL AND payload <> '{}'::jsonb)::integer AS non_empty_payload_count,
  COALESCE(SUM(pg_column_size(payload)), 0)::bigint AS total_payload_bytes,
  ROUND(COALESCE(SUM(pg_column_size(payload)), 0)::numeric / 1024 / 1024, 2) AS total_payload_mb,
  ROUND(COALESCE(AVG(pg_column_size(payload)), 0)::numeric, 2) AS avg_payload_bytes,
  MAX(pg_column_size(payload)) AS max_payload_bytes
FROM spec_sheets;

\echo '3) spec_sheets payload key 사용 빈도'
SELECT
  key,
  COUNT(*)::integer AS row_count
FROM spec_sheets s
CROSS JOIN LATERAL jsonb_object_keys(COALESCE(s.payload, '{}'::jsonb)) AS key
GROUP BY key
ORDER BY row_count DESC, key ASC;

\echo '4) summary/hydrate 의존 key 사용 빈도'
WITH target_keys(key) AS (
  VALUES
    ('displayTitle'),
    ('baseTitle'),
    ('workOrderKind'),
    ('reorderGroupId'),
    ('reorderRound'),
    ('parentSpecSheetId'),
    ('isDefectOrder'),
    ('category1'),
    ('category2'),
    ('category3'),
    ('category1Id'),
    ('category2Id'),
    ('category3Id'),
    ('season'),
    ('priority'),
    ('vendor'),
    ('manager'),
    ('managerId'),
    ('createdById'),
    ('createdByRole'),
    ('dueDate'),
    ('quantity'),
    ('inventoryQuantity'),
    ('inventoryStatus'),
    ('workflowState'),
    ('lastSavedAt'),
    ('orderEntries'),
    ('materials'),
    ('outsourcing'),
    ('attachments'),
    ('memoThreads'),
    ('factoryOrderRequest')
)
SELECT
  target_keys.key,
  COUNT(s.id) FILTER (WHERE s.payload ? target_keys.key)::integer AS present_count,
  COUNT(s.id) FILTER (WHERE NULLIF(s.payload->>target_keys.key, '') IS NOT NULL)::integer AS non_empty_text_count
FROM target_keys
LEFT JOIN spec_sheets s ON true
GROUP BY target_keys.key
ORDER BY present_count DESC, target_keys.key ASC;

\echo '5) 통계 fallback 후보 key 사용 빈도'
WITH target_keys(key) AS (
  VALUES
    ('category1Label'),
    ('category1'),
    ('category2Label'),
    ('category2'),
    ('category3Label'),
    ('category3'),
    ('categoryLabel'),
    ('category'),
    ('name'),
    ('productName')
)
SELECT
  target_keys.key,
  COUNT(s.id) FILTER (WHERE s.payload ? target_keys.key)::integer AS present_count,
  COUNT(s.id) FILTER (WHERE NULLIF(s.payload->>target_keys.key, '') IS NOT NULL)::integer AS non_empty_text_count
FROM target_keys
LEFT JOIN spec_sheets s ON true
GROUP BY target_keys.key
ORDER BY present_count DESC, target_keys.key ASC;

\echo '6) payload 크기 상위 작업지시서'
SELECT
  id,
  title,
  status,
  work_order_kind,
  reorder_round,
  pg_column_size(payload) AS payload_bytes,
  jsonb_array_length(COALESCE(payload->'orderEntries', '[]'::jsonb)) AS payload_order_entries,
  jsonb_array_length(COALESCE(payload->'materials', '[]'::jsonb)) AS payload_materials,
  jsonb_array_length(COALESCE(payload->'outsourcing', '[]'::jsonb)) AS payload_outsourcing,
  jsonb_array_length(COALESCE(payload->'attachments', '[]'::jsonb)) AS payload_attachments,
  jsonb_array_length(COALESCE(payload->'memoThreads', '[]'::jsonb)) AS payload_memo_threads
FROM spec_sheets
ORDER BY pg_column_size(payload) DESC NULLS LAST
LIMIT 20;

\echo '7) 정규 컬럼과 payload 값 불일치 후보'
SELECT
  id,
  title,
  status AS column_status,
  payload->>'workflowState' AS payload_workflow_state,
  work_order_kind AS column_work_order_kind,
  payload->>'workOrderKind' AS payload_work_order_kind,
  reorder_round AS column_reorder_round,
  payload->>'reorderRound' AS payload_reorder_round,
  category1_id AS column_category1_id,
  payload->>'category1Id' AS payload_category1_id,
  category2_id AS column_category2_id,
  payload->>'category2Id' AS payload_category2_id,
  category3_id AS column_category3_id,
  payload->>'category3Id' AS payload_category3_id
FROM spec_sheets
WHERE
  (payload ? 'workflowState' AND COALESCE(status, '') <> COALESCE(payload->>'workflowState', ''))
  OR (payload ? 'workOrderKind' AND COALESCE(work_order_kind, '') <> COALESCE(payload->>'workOrderKind', ''))
  OR (payload ? 'reorderRound' AND COALESCE(reorder_round::text, '') <> COALESCE(payload->>'reorderRound', ''))
  OR (payload ? 'category1Id' AND COALESCE(category1_id, '') <> COALESCE(payload->>'category1Id', ''))
  OR (payload ? 'category2Id' AND COALESCE(category2_id, '') <> COALESCE(payload->>'category2Id', ''))
  OR (payload ? 'category3Id' AND COALESCE(category3_id, '') <> COALESCE(payload->>'category3Id', ''))
ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
LIMIT 50;

\echo '8) 정규 테이블 row 보유 현황'
SELECT 'spec_sheets' AS table_name, COUNT(*)::integer AS row_count FROM spec_sheets
UNION ALL
SELECT 'orders', COUNT(*)::integer FROM orders
UNION ALL
SELECT 'spec_sheet_materials', COUNT(*)::integer FROM spec_sheet_materials
UNION ALL
SELECT 'material_stocks', COUNT(*)::integer FROM material_stocks
UNION ALL
SELECT 'spec_sheet_outsourcing_lines', COUNT(*)::integer FROM spec_sheet_outsourcing_lines
UNION ALL
SELECT 'attachments', COUNT(*)::integer FROM attachments
UNION ALL
SELECT 'memos', COUNT(*)::integer FROM memos
ORDER BY table_name;
