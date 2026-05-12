-- 작업지시서 payload 정규화 상태 진단 SQL
-- 0.10.93 이후에는 payload 컬럼이 없는 상태가 정상이다.

\echo '1) payload 컬럼 잔존 여부'
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name IN ('spec_sheets', 'spec_sheet_materials', 'material_stocks', 'spec_sheet_outsourcing_lines')
  AND column_name = 'payload'
ORDER BY table_name;

\echo '2) spec_sheets 정규화 핵심 컬럼 존재 여부'
WITH expected_columns(column_name) AS (
  VALUES
    ('display_title'),
    ('base_title'),
    ('category1'),
    ('category2'),
    ('category3'),
    ('season'),
    ('priority'),
    ('vendor'),
    ('manager'),
    ('manager_id'),
    ('created_by_id'),
    ('created_by_role'),
    ('due_date'),
    ('quantity'),
    ('inventory_quantity'),
    ('inventory_status'),
    ('memo')
)
SELECT e.column_name,
       CASE WHEN c.column_name IS NULL THEN 'missing' ELSE 'present' END AS status
FROM expected_columns e
LEFT JOIN information_schema.columns c
  ON c.table_schema = current_schema()
 AND c.table_name = 'spec_sheets'
 AND c.column_name = e.column_name
ORDER BY e.column_name;

\echo '3) spec_sheets 정규화 데이터 채움 현황'
SELECT COUNT(*)::integer AS total_workorders,
       COUNT(*) FILTER (WHERE NULLIF(display_title, '') IS NOT NULL)::integer AS display_title_count,
       COUNT(*) FILTER (WHERE NULLIF(category1, '') IS NOT NULL)::integer AS category1_count,
       COUNT(*) FILTER (WHERE NULLIF(category2, '') IS NOT NULL)::integer AS category2_count,
       COUNT(*) FILTER (WHERE NULLIF(category3, '') IS NOT NULL)::integer AS category3_count,
       COUNT(*) FILTER (WHERE NULLIF(due_date, '') IS NOT NULL)::integer AS due_date_count,
       COUNT(*) FILTER (WHERE quantity > 0)::integer AS quantity_count,
       COUNT(*) FILTER (WHERE NULLIF(inventory_status, '') IS NOT NULL)::integer AS inventory_status_count
FROM spec_sheets;

\echo '4) 정규 상세 테이블 row 보유 현황'
SELECT 'orders' AS table_name, COUNT(*)::integer AS row_count FROM orders
UNION ALL
SELECT 'spec_sheet_materials', COUNT(*)::integer FROM spec_sheet_materials
UNION ALL
SELECT 'spec_sheet_outsourcing_lines', COUNT(*)::integer FROM spec_sheet_outsourcing_lines
UNION ALL
SELECT 'attachments', COUNT(*)::integer FROM attachments
UNION ALL
SELECT 'memos', COUNT(*)::integer FROM memos
ORDER BY table_name;
