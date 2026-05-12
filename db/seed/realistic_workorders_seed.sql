-- PeaceByPiece realistic workorder / attachment seed
-- Version: 0.10.89
-- Purpose:
--   Creates deterministic workorder + attachment metadata rows that can be used by
--   scripts/seed-r2-demo-files.mjs to generate/upload R2 demo files.
--
-- Recommended order:
--   psql $env:DATABASE_URL -f db/schema/full_reset.sql
--   psql $env:DATABASE_URL -f db/seed/system_standards_seed.sql
--   psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
--   psql $env:DATABASE_URL -f db/seed/realistic_workorders_seed.sql

BEGIN;

-- Remove only this seed's deterministic rows. Do not touch user-created rows.
DELETE FROM attachment_trash_items WHERE attachment_id LIKE 'realistic-attachment-%';
DELETE FROM attachments WHERE id LIKE 'realistic-attachment-%';
DELETE FROM memos WHERE id LIKE 'realistic-memo-%';
DELETE FROM history_logs WHERE id LIKE 'realistic-history-%';
DELETE FROM spec_sheet_outsourcing_lines WHERE id LIKE 'realistic-outsourcing-%';
DELETE FROM spec_sheet_materials WHERE id LIKE 'realistic-material-%';
DELETE FROM material_stocks WHERE id LIKE 'realistic-stock-%';
DELETE FROM orders WHERE id LIKE 'realistic-order-%';
DELETE FROM spec_sheets WHERE id LIKE 'realistic-spec-%';
DELETE FROM partner_items WHERE id LIKE 'realistic-partner-item-%';
DELETE FROM partners WHERE id LIKE 'realistic-partner-%';

INSERT INTO partners (id, company_id, company_name, name, contact_person, contact, email, memo, is_active)
VALUES
  ('realistic-partner-factory-01', 'company-sample-customer', '샘플 고객사', '나주 샘플실 A', '김미싱', '010-1000-0001', 'factory-a@example.com', '본봉/오버록 중심 테스트 공장', true),
  ('realistic-partner-factory-02', 'company-sample-customer', '샘플 고객사', '광주 봉제공장 B', '박라인', '010-1000-0002', 'factory-b@example.com', '납기 지연 케이스 포함 테스트 공장', true),
  ('realistic-partner-factory-03', 'company-sample-customer', '샘플 고객사', '서울 소량제작 C', '이패턴', '010-1000-0003', 'factory-c@example.com', '소량 고단가 테스트 공장', true),
  ('realistic-partner-material-01', 'company-sample-customer', '샘플 고객사', '동대문 원단상사', '최원단', '010-2000-0001', 'fabric@example.com', '원단 매입 테스트 거래처', true),
  ('realistic-partner-subsidiary-01', 'company-sample-customer', '샘플 고객사', '부자재마켓', '정단추', '010-3000-0001', 'subsidiary@example.com', '단추/지퍼/라벨 테스트 거래처', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO partner_items (id, company_id, company_name, partner_id, item_type, item_name, unit, unit_cost, memo, is_active)
VALUES
  ('realistic-partner-item-factory-01', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-01', 'factory', '티셔츠 봉제', '장', 4200, '기본 봉제 단가', true),
  ('realistic-partner-item-factory-02', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-02', 'factory', '슬랙스 봉제', '장', 8600, '하의 봉제 단가', true),
  ('realistic-partner-item-factory-03', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-03', 'factory', '자켓 봉제', '장', 18500, '아우터 봉제 단가', true),
  ('realistic-partner-item-material-01', 'company-sample-customer', '샘플 고객사', 'realistic-partner-material-01', 'fabric', '30수 면 싱글', '야드', 3200, '상의 테스트 원단', true),
  ('realistic-partner-item-subsidiary-01', 'company-sample-customer', '샘플 고객사', 'realistic-partner-subsidiary-01', 'subsidiary', '케어라벨', '장', 120, '부자재 테스트', true)
ON CONFLICT (id) DO NOTHING;

WITH workorders AS (
  SELECT
    n,
    CASE WHEN n >= 900 THEN format('realistic-spec-%s', n)
         ELSE format('realistic-spec-%s', lpad(n::text, 3, '0')) END AS id,
    CASE (n % 6)
      WHEN 0 THEN 'draft'
      WHEN 1 THEN 'reviewing'
      WHEN 2 THEN 'order_requested'
      WHEN 3 THEN 'in_production'
      WHEN 4 THEN 'inspection'
      ELSE 'completed'
    END AS status,
    CASE (n % 3)
      WHEN 0 THEN '상의'
      WHEN 1 THEN '하의'
      ELSE '아우터'
    END AS category1,
    CASE (n % 3)
      WHEN 0 THEN '티셔츠'
      WHEN 1 THEN '팬츠'
      ELSE '자켓'
    END AS category2,
    CASE (n % 3)
      WHEN 0 THEN '반팔'
      WHEN 1 THEN '슬랙스'
      ELSE '테일러드'
    END AS category3,
    CASE (n % 3)
      WHEN 0 THEN 'category:상의'
      WHEN 1 THEN 'category:하의'
      ELSE 'category:아우터'
    END AS category1_id,
    CASE (n % 3)
      WHEN 0 THEN 'category:상의:티셔츠'
      WHEN 1 THEN 'category:하의:팬츠'
      ELSE 'category:아우터:자켓'
    END AS category2_id,
    CASE (n % 3)
      WHEN 0 THEN 'category:상의:티셔츠:반팔'
      WHEN 1 THEN 'category:하의:팬츠:슬랙스'
      ELSE 'category:아우터:자켓:테일러드'
    END AS category3_id,
    CASE (n % 4)
      WHEN 0 THEN 'realistic-partner-factory-01'
      WHEN 1 THEN 'realistic-partner-factory-02'
      WHEN 2 THEN 'realistic-partner-factory-03'
      ELSE 'realistic-partner-factory-01'
    END AS factory_partner_id,
    CASE (n % 4)
      WHEN 0 THEN '나주 샘플실 A'
      WHEN 1 THEN '광주 봉제공장 B'
      WHEN 2 THEN '서울 소량제작 C'
      ELSE '나주 샘플실 A'
    END AS factory_name,
    (40 + (n % 12) * 15)::integer AS quantity,
    (current_date + ((n % 45) - 15))::text AS due_date,
    (now() - ((n % 120) || ' days')::interval) AS created_at,
    (now() - ((n % 20) || ' days')::interval) AS updated_at,
    CASE WHEN n % 10 IN (0, 1, 2) THEN 1 ELSE 0 END AS reorder_round,
    CASE WHEN n % 18 = 0 THEN true ELSE false END AS is_rework
  FROM (
    SELECT generate_series(1, 96) AS n
    UNION ALL
    SELECT generate_series(901, 920) AS n
  ) source
), inserted_specs AS (
  INSERT INTO spec_sheets (
    id,
    company_id,
    company_name,
    title,
    status,
    work_order_kind,
    reorder_group_id,
    reorder_round,
    parent_spec_sheet_id,
    is_rework,
    category1_id,
    category2_id,
    category3_id,
    is_active,
    payload,
    created_at,
    updated_at,
    deleted_at
  )
  SELECT
    w.id,
    'company-sample-customer',
    '샘플 고객사',
    format('현실 테스트 작업지시서 %s - %s %s', w.n, w.category2, w.category3),
    w.status,
    CASE WHEN w.is_rework THEN 'rework' WHEN w.reorder_round > 0 THEN 'main' ELSE 'sample' END,
    CASE WHEN w.reorder_round > 0 THEN format('realistic-reorder-group-%s', (w.n % 16) + 1) ELSE w.id END,
    w.reorder_round,
    NULL,
    w.is_rework,
    w.category1_id,
    w.category2_id,
    w.category3_id,
    true,
    jsonb_build_object(
      'displayTitle', format('현실 테스트 작업지시서 %s', w.n),
      'baseTitle', format('현실 테스트 작업지시서 %s', w.n),
      'category1', w.category1,
      'category2', w.category2,
      'category3', w.category3,
      'category1Id', w.category1_id,
      'category2Id', w.category2_id,
      'category3Id', w.category3_id,
      'season', CASE WHEN w.n % 2 = 0 THEN 'SS' ELSE 'FW' END,
      'priority', CASE WHEN w.n % 5 = 0 THEN '긴급' WHEN w.n % 5 = 1 THEN '높음' ELSE '보통' END,
      'vendor', w.factory_name,
      'manager', CASE WHEN w.n % 3 = 0 THEN '샘플 관리자' WHEN w.n % 3 = 1 THEN '샘플 디자이너' ELSE '샘플 검수담당자' END,
      'managerId', CASE WHEN w.n % 3 = 0 THEN 'user-sample-admin' WHEN w.n % 3 = 1 THEN 'user-sample-designer' ELSE 'user-sample-inspector' END,
      'createdById', 'user-sample-admin',
      'createdByRole', 'admin',
      'dueDate', w.due_date,
      'quantity', w.quantity,
      'laborCost', 4200 + (w.n % 7) * 900,
      'lossCost', 300 + (w.n % 5) * 120,
      'inventoryQuantity', CASE WHEN w.status = 'completed' THEN w.quantity - (w.n % 6) ELSE 0 END,
      'inventoryStatus', CASE WHEN w.status = 'completed' THEN 'checked' ELSE 'unchecked' END,
      'memo', '성능/통계/R2 업로드 검증용 현실형 더미 작업지시서입니다.',
      'workflowState', w.status,
      'lastSavedAt', to_char(w.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'orderEntries', jsonb_build_array(jsonb_build_object(
        'id', format('realistic-order-entry-%s', w.id),
        'type', '생산발주',
        'targetType', 'factory',
        'factory', w.factory_name,
        'dueDate', w.due_date,
        'quantity', w.quantity,
        'laborCost', 4200 + (w.n % 7) * 900,
        'lossCost', 300 + (w.n % 5) * 120,
        'priority', CASE WHEN w.n % 5 = 0 THEN '긴급' WHEN w.n % 5 = 1 THEN '높음' ELSE '보통' END,
        'inspectionStatus', CASE WHEN w.status = 'completed' THEN 'passed' WHEN w.n % 13 = 0 THEN 'failed' ELSE 'unchecked' END
      )),
      'materials', jsonb_build_array(jsonb_build_object(
        'id', format('realistic-material-%s-main', w.id),
        'materialType', 'fabric',
        'name', CASE WHEN w.category1 = '상의' THEN '30수 면 싱글' WHEN w.category1 = '하의' THEN 'TR 스판 원단' ELSE '울 혼방 원단' END,
        'vendor', '동대문 원단상사',
        'quantity', round((w.quantity * 1.15)::numeric, 2),
        'unit', '야드',
        'unitCost', 3200 + (w.n % 8) * 250,
        'totalCost', round((w.quantity * 1.15 * (3200 + (w.n % 8) * 250))::numeric, 2),
        'status', 'confirmed'
      )),
      'outsourcing', jsonb_build_array(jsonb_build_object(
        'id', format('realistic-outsourcing-%s-print', w.id),
        'process', CASE WHEN w.n % 4 = 0 THEN '자수' WHEN w.n % 4 = 1 THEN '나염' WHEN w.n % 4 = 2 THEN '워싱' ELSE '후가공' END,
        'vendor', '외주 테스트 업체',
        'quantity', w.quantity,
        'unitType', '장',
        'unitCost', 800 + (w.n % 5) * 150,
        'totalCost', w.quantity * (800 + (w.n % 5) * 150),
        'status', 'planned'
      )),
      'attachments', jsonb_build_array(
        jsonb_build_object(
          'id', format('realistic-attachment-%s-design', CASE WHEN w.n >= 900 THEN w.n::text ELSE lpad(w.n::text, 3, '0') END),
          'name', format('design-%s.png', w.id),
          'type', 'image',
          'url', format('/api/workorders/attachments/file?key=workorders/%s/design/design-%s.png', w.id, w.id),
          'storageKey', format('workorders/%s/design/design-%s.png', w.id, w.id),
          'thumbnailKey', format('workorders/%s/design/thumb-design-%s.png', w.id, w.id),
          'scope', 'design',
          'ownerId', 'user-sample-designer',
          'ownerName', '샘플 디자이너',
          'isPrimary', true
        ),
        jsonb_build_object(
          'id', format('realistic-attachment-%s-spec', CASE WHEN w.n >= 900 THEN w.n::text ELSE lpad(w.n::text, 3, '0') END),
          'name', format('spec-%s.pdf', w.id),
          'type', 'pdf',
          'url', format('/api/workorders/attachments/file?key=workorders/%s/attachments/spec-%s.pdf', w.id, w.id),
          'storageKey', format('workorders/%s/attachments/spec-%s.pdf', w.id, w.id),
          'scope', 'attachment',
          'ownerId', 'user-sample-admin',
          'ownerName', '샘플 관리자',
          'isPrimary', false
        )
      ),
      'memoThreads', jsonb_build_array(jsonb_build_object(
        'id', format('realistic-memo-%s-thread', w.id),
        'authorId', 'user-sample-admin',
        'authorName', '샘플 관리자',
        'authorRole', 'admin',
        'content', '더미 데이터 검수 메모입니다.',
        'createdAt', to_char(w.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'attachmentIds', jsonb_build_array(),
        'replies', jsonb_build_array()
      ))
    ),
    w.created_at,
    w.updated_at,
    NULL
  FROM workorders w
  RETURNING id
)
INSERT INTO orders (
  id,
  company_id,
  company_name,
  spec_sheet_id,
  factory_partner_id,
  factory_name,
  quantity,
  due_date,
  labor_cost,
  loss_cost,
  status,
  is_active,
  created_at,
  updated_at
)
SELECT
  format('realistic-order-%s', w.id),
  'company-sample-customer',
  '샘플 고객사',
  w.id,
  w.factory_partner_id,
  w.factory_name,
  w.quantity,
  w.due_date,
  4200 + (w.n % 7) * 900,
  300 + (w.n % 5) * 120,
  w.status,
  true,
  w.created_at,
  w.updated_at
FROM workorders w;

WITH workorders AS (
  SELECT
    n,
    CASE WHEN n >= 900 THEN format('realistic-spec-%s', n)
         ELSE format('realistic-spec-%s', lpad(n::text, 3, '0')) END AS id,
    CASE (n % 3)
      WHEN 0 THEN '상의'
      WHEN 1 THEN '하의'
      ELSE '아우터'
    END AS category1,
    (40 + (n % 12) * 15)::integer AS quantity,
    (now() - ((n % 120) || ' days')::interval) AS created_at,
    (now() - ((n % 20) || ' days')::interval) AS updated_at
  FROM (
    SELECT generate_series(1, 96) AS n
    UNION ALL
    SELECT generate_series(901, 920) AS n
  ) source
)
INSERT INTO spec_sheet_materials (
  id,
  company_id,
  company_name,
  spec_sheet_id,
  material_type,
  name,
  vendor,
  quantity,
  unit,
  unit_cost,
  total_cost,
  status,
  payload,
  is_active,
  created_at,
  updated_at
)
SELECT
  format('realistic-material-%s-main', w.id),
  'company-sample-customer',
  '샘플 고객사',
  w.id,
  'fabric',
  CASE WHEN w.category1 = '상의' THEN '30수 면 싱글' WHEN w.category1 = '하의' THEN 'TR 스판 원단' ELSE '울 혼방 원단' END,
  '동대문 원단상사',
  round((w.quantity * 1.15)::numeric, 2),
  '야드',
  3200 + (w.n % 8) * 250,
  round((w.quantity * 1.15 * (3200 + (w.n % 8) * 250))::numeric, 2),
  'confirmed',
  '{}'::jsonb,
  true,
  w.created_at,
  w.updated_at
FROM workorders w;

WITH workorders AS (
  SELECT
    n,
    CASE WHEN n >= 900 THEN format('realistic-spec-%s', n)
         ELSE format('realistic-spec-%s', lpad(n::text, 3, '0')) END AS id,
    (40 + (n % 12) * 15)::integer AS quantity,
    (now() - ((n % 120) || ' days')::interval) AS created_at,
    (now() - ((n % 20) || ' days')::interval) AS updated_at
  FROM (
    SELECT generate_series(1, 96) AS n
    UNION ALL
    SELECT generate_series(901, 920) AS n
  ) source
)
INSERT INTO spec_sheet_outsourcing_lines (
  id,
  company_id,
  company_name,
  spec_sheet_id,
  process,
  vendor,
  quantity,
  unit,
  unit_cost,
  total_cost,
  status,
  payload,
  is_active,
  created_at,
  updated_at
)
SELECT
  format('realistic-outsourcing-%s-print', w.id),
  'company-sample-customer',
  '샘플 고객사',
  w.id,
  CASE WHEN w.n % 4 = 0 THEN '자수' WHEN w.n % 4 = 1 THEN '나염' WHEN w.n % 4 = 2 THEN '워싱' ELSE '후가공' END,
  '외주 테스트 업체',
  w.quantity,
  '장',
  800 + (w.n % 5) * 150,
  w.quantity * (800 + (w.n % 5) * 150),
  'planned',
  '{}'::jsonb,
  true,
  w.created_at,
  w.updated_at
FROM workorders w;

WITH workorders AS (
  SELECT
    n,
    CASE WHEN n >= 900 THEN format('realistic-spec-%s', n)
         ELSE format('realistic-spec-%s', lpad(n::text, 3, '0')) END AS id,
    CASE WHEN n >= 900 THEN n::text ELSE lpad(n::text, 3, '0') END AS suffix,
    (40 + (n % 12) * 15)::integer AS quantity,
    (now() - ((n % 120) || ' days')::interval) AS created_at,
    (now() - ((n % 20) || ' days')::interval) AS updated_at
  FROM (
    SELECT generate_series(1, 96) AS n
    UNION ALL
    SELECT generate_series(901, 920) AS n
  ) source
), attachment_rows AS (
  SELECT
    format('realistic-attachment-%s-design', suffix) AS id,
    'company-sample-customer' AS company_id,
    '샘플 고객사' AS company_name,
    id AS order_id,
    'design' AS type,
    format('workorders/%s/design/design-%s.png', id, id) AS storage_key,
    format('workorders/%s/design/thumb-design-%s.png', id, id) AS thumbnail_key,
    format('design-%s.png', id) AS original_name,
    'image/png' AS mime_type,
    (180000 + (n % 18) * 45000)::bigint AS size_bytes,
    'user-sample-designer' AS author_id,
    true AS is_primary,
    created_at,
    updated_at
  FROM workorders
  UNION ALL
  SELECT
    format('realistic-attachment-%s-spec', suffix) AS id,
    'company-sample-customer',
    '샘플 고객사',
    id,
    'file',
    format('workorders/%s/attachments/spec-%s.pdf', id, id),
    NULL,
    format('spec-%s.pdf', id),
    'application/pdf',
    (360000 + (n % 24) * 85000)::bigint,
    'user-sample-admin',
    false,
    created_at,
    updated_at
  FROM workorders
  UNION ALL
  SELECT
    format('realistic-attachment-%s-memo', suffix) AS id,
    'company-sample-customer',
    '샘플 고객사',
    id,
    'memo',
    format('workorders/%s/memos/memo-%s.txt', id, id),
    NULL,
    format('memo-%s.txt', id),
    'text/plain',
    (24000 + (n % 10) * 5000)::bigint,
    'user-sample-admin',
    false,
    created_at,
    updated_at
  FROM workorders
)
INSERT INTO attachments (
  id,
  company_id,
  company_name,
  order_id,
  type,
  storage_key,
  thumbnail_key,
  original_name,
  mime_type,
  size_bytes,
  author_id,
  is_primary,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  company_id,
  company_name,
  order_id,
  type,
  storage_key,
  thumbnail_key,
  original_name,
  mime_type,
  size_bytes,
  author_id,
  is_primary,
  true,
  created_at,
  updated_at
FROM attachment_rows;

WITH workorders AS (
  SELECT
    n,
    CASE WHEN n >= 900 THEN format('realistic-spec-%s', n)
         ELSE format('realistic-spec-%s', lpad(n::text, 3, '0')) END AS id,
    (now() - ((n % 120) || ' days')::interval) AS created_at
  FROM (
    SELECT generate_series(1, 96) AS n
    UNION ALL
    SELECT generate_series(901, 920) AS n
  ) source
)
INSERT INTO memos (
  id,
  company_id,
  company_name,
  order_id,
  parent_id,
  body,
  author_id,
  is_active,
  delete_status,
  purge_status,
  created_at,
  updated_at
)
SELECT
  format('realistic-memo-%s-thread', w.id),
  'company-sample-customer',
  '샘플 고객사',
  w.id,
  NULL,
  '더미 데이터 검수 메모입니다.',
  'user-sample-admin',
  true,
  'active',
  'none',
  w.created_at,
  w.created_at
FROM workorders w;

INSERT INTO storage_usage_snapshots (
  id,
  company_id,
  used_bytes,
  attachment_count,
  source,
  memo,
  measured_at
)
SELECT
  'storage-snapshot-realistic-seed',
  'company-sample-customer',
  COALESCE(SUM(size_bytes), 0),
  COUNT(*),
  'db_attachment_metadata',
  'realistic_workorders_seed.sql generated attachment metadata',
  now()
FROM attachments
WHERE id LIKE 'realistic-attachment-%'
ON CONFLICT (id) DO UPDATE SET
  used_bytes = EXCLUDED.used_bytes,
  attachment_count = EXCLUDED.attachment_count,
  source = EXCLUDED.source,
  memo = EXCLUDED.memo,
  measured_at = EXCLUDED.measured_at;

COMMIT;

SELECT
  'realistic workorder seed completed' AS result,
  (SELECT COUNT(*) FROM spec_sheets WHERE id LIKE 'realistic-spec-%') AS workorder_count,
  (SELECT COUNT(*) FROM attachments WHERE id LIKE 'realistic-attachment-%') AS attachment_metadata_count,
  (SELECT COUNT(*) FROM attachments WHERE id LIKE 'realistic-attachment-9%') AS stats_fixture_attachment_count,
  (SELECT COUNT(*) FROM attachments WHERE id LIKE 'realistic-attachment-%' AND storage_key LIKE 'workorders/' || order_id || '/%') AS matched_storage_key_count,
  ROUND((SELECT COALESCE(SUM(size_bytes), 0) FROM attachments WHERE id LIKE 'realistic-attachment-%') / 1024.0 / 1024.0, 2) AS attachment_metadata_mb;
