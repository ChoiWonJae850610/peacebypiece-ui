-- PeaceByPiece 0.9.2227 / 0.9.224342 보정
-- 6개월 realistic 통계/작업지시서 개발 seed 데이터
--
-- 실행 전제:
-- 1) db/schema/full_reset.sql 실행
-- 2) db/schema/full_reset_smoke_test.sql 실행
-- 3) 이 파일 실행
--
-- 목적:
-- - 고객관리자 통계 화면(/admin/dashboard)에서 실제 DB 집계처럼 보이는 데이터 확인
-- - 0.9.22434 통계 화면 기준(발주수량 TOP5, 리오더 차수 TOP5, 불량 작업지시서 TOP5)을 검증하는 고정 케이스 포함
-- - 작업지시서 약 100개 + 통계 검증 고정 케이스, 협력업체/공장/원단/부자재/외주, 리오더/납기/검수 후보 데이터 구성
-- - R2 더미 업로드 스크립트에서 사용할 attachments metadata와 storage_key 선배치
-- - 0.9.224342 기준 DB attachment metadata와 R2 object가 같은 작업지시서 storage_key로 매칭되도록 보정
--
-- 주의:
-- - 운영 DB 실행 금지
-- - 개발/샘플 고객사(company-sample-customer) 기준
-- - 실제 R2 파일은 아직 업로드하지 않는다. scripts/seed-r2-demo-files.mjs가 attachments.storage_key에 맞춰 업로드한다.

BEGIN;

-- =========================================
-- 0) 기존 realistic/demo seed 제거
-- =========================================

DELETE FROM attachment_trash_items WHERE attachment_id LIKE 'realistic-%' OR attachment_id LIKE 'stats-demo-%';
DELETE FROM attachments WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM memos WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM history_logs WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM spec_sheet_outsourcing_lines WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM spec_sheet_materials WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM orders WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM spec_sheets WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM partner_items WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM partners WHERE id LIKE 'realistic-%' OR id LIKE 'stats-demo-%';
DELETE FROM company_workorder_daily_stats WHERE company_id = 'company-sample-customer' AND stats_date >= current_date - interval '210 days';
DELETE FROM company_workorder_monthly_stats WHERE company_id = 'company-sample-customer' AND stats_month >= date_trunc('month', current_date - interval '210 days')::date;
DELETE FROM company_storage_daily_stats WHERE company_id = 'company-sample-customer' AND stats_date >= current_date - interval '210 days';

-- =========================================
-- 1) 카테고리 보강
-- =========================================

INSERT INTO item_categories (id, company_id, parent_id, level, name, is_active, sort_order)
VALUES
  ('realistic-category:상의:셔츠', 'company-sample-customer', 'category:상의', 2, '셔츠', true, 20),
  ('realistic-category:상의:셔츠:오버핏', 'company-sample-customer', 'realistic-category:상의:셔츠', 3, '오버핏', true, 10),
  ('realistic-category:상의:셔츠:린넨', 'company-sample-customer', 'realistic-category:상의:셔츠', 3, '린넨', true, 20),
  ('realistic-category:상의:블라우스', 'company-sample-customer', 'category:상의', 2, '블라우스', true, 30),
  ('realistic-category:상의:블라우스:기본', 'company-sample-customer', 'realistic-category:상의:블라우스', 3, '기본', true, 10),
  ('realistic-category:상의:조끼', 'company-sample-customer', 'category:상의', 2, '조끼', true, 40),
  ('realistic-category:상의:조끼:니트', 'company-sample-customer', 'realistic-category:상의:조끼', 3, '니트', true, 10),
  ('realistic-category:하의:스커트', 'company-sample-customer', 'category:하의', 2, '스커트', true, 20),
  ('realistic-category:하의:스커트:플리츠', 'company-sample-customer', 'realistic-category:하의:스커트', 3, '플리츠', true, 10),
  ('realistic-category:하의:스커트:데님', 'company-sample-customer', 'realistic-category:하의:스커트', 3, '데님', true, 20),
  ('realistic-category:하의:팬츠:와이드', 'company-sample-customer', 'category:하의:팬츠', 3, '와이드', true, 20),
  ('realistic-category:원피스', 'company-sample-customer', NULL, 1, '원피스', true, 40),
  ('realistic-category:원피스:셔츠', 'company-sample-customer', 'realistic-category:원피스', 2, '셔츠 원피스', true, 10),
  ('realistic-category:원피스:셔츠:기본', 'company-sample-customer', 'realistic-category:원피스:셔츠', 3, '기본', true, 10),
  ('realistic-category:원피스:롱', 'company-sample-customer', 'realistic-category:원피스', 2, '롱 원피스', true, 20),
  ('realistic-category:원피스:롱:기본', 'company-sample-customer', 'realistic-category:원피스:롱', 3, '기본', true, 10),
  ('realistic-category:아우터:코트', 'company-sample-customer', 'category:아우터', 2, '코트', true, 20),
  ('realistic-category:아우터:코트:트렌치', 'company-sample-customer', 'realistic-category:아우터:코트', 3, '트렌치', true, 10),
  ('realistic-category:아우터:집업', 'company-sample-customer', 'category:아우터', 2, '집업', true, 30),
  ('realistic-category:아우터:집업:후드', 'company-sample-customer', 'realistic-category:아우터:집업', 3, '후드', true, 10),
  ('realistic-category:아우터:자켓:크롭', 'company-sample-customer', 'category:아우터:자켓', 3, '크롭', true, 20)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- =========================================
-- 2) 협력업체 seed
-- =========================================

INSERT INTO partners (id, company_id, company_name, name, contact_person, contact, email, memo, is_active, created_at, updated_at)
VALUES
  ('realistic-partner-factory-01', 'company-sample-customer', '샘플 고객사', '빛가람 봉제 A', '김봉제', '010-2100-1001', 'factory-a@example.com', '납기 안정적인 주력 공장', true, now() - interval '210 days', now() - interval '2 days'),
  ('realistic-partner-factory-02', 'company-sample-customer', '샘플 고객사', '나주 샘플실 B', '박샘플', '010-2100-1002', 'factory-b@example.com', '소량 샘플 대응 빠름', true, now() - interval '205 days', now() - interval '3 days'),
  ('realistic-partner-factory-03', 'company-sample-customer', '샘플 고객사', '광주 봉제 C', '최봉제', '010-2100-1003', 'factory-c@example.com', '리오더 물량 대응', true, now() - interval '200 days', now() - interval '4 days'),
  ('realistic-partner-factory-04', 'company-sample-customer', '샘플 고객사', '담양 생산 D', '정생산', '010-2100-1004', 'factory-d@example.com', '납기 지연 케이스 일부 포함', true, now() - interval '190 days', now() - interval '5 days'),
  ('realistic-partner-factory-05', 'company-sample-customer', '샘플 고객사', '목포 봉제 E', '이봉제', '010-2100-1005', 'factory-e@example.com', '검수 이슈 확인용 케이스 포함', true, now() - interval '180 days', now() - interval '6 days'),
  ('realistic-partner-fabric-01', 'company-sample-customer', '샘플 고객사', '남평 원단상사', '한원단', '010-2100-2001', 'fabric-a@example.com', '면/린넨류', true, now() - interval '185 days', now() - interval '2 days'),
  ('realistic-partner-fabric-02', 'company-sample-customer', '샘플 고객사', '서울 원단창고', '서원단', '010-2100-2002', 'fabric-b@example.com', '트윌/데님류', true, now() - interval '170 days', now() - interval '7 days'),
  ('realistic-partner-fabric-03', 'company-sample-customer', '샘플 고객사', '동대문 니트원단', '문니트', '010-2100-2003', 'fabric-c@example.com', '니트/쭈리류', true, now() - interval '160 days', now() - interval '8 days'),
  ('realistic-partner-subsidiary-01', 'company-sample-customer', '샘플 고객사', '라벨앤버튼', '라벨김', '010-2100-3001', 'sub-a@example.com', '라벨/단추/지퍼', true, now() - interval '175 days', now() - interval '5 days'),
  ('realistic-partner-subsidiary-02', 'company-sample-customer', '샘플 고객사', '부자재팩토리', '부자재박', '010-2100-3002', 'sub-b@example.com', '고무줄/심지/부속', true, now() - interval '150 days', now() - interval '9 days'),
  ('realistic-partner-outsourcing-01', 'company-sample-customer', '샘플 고객사', '나염공방 프린트', '나염오', '010-2100-4001', 'print@example.com', '나염 외주', true, now() - interval '155 days', now() - interval '6 days'),
  ('realistic-partner-outsourcing-02', 'company-sample-customer', '샘플 고객사', '자수작업실 스티치', '자수신', '010-2100-4002', 'emb@example.com', '자수 외주', true, now() - interval '145 days', now() - interval '10 days');

INSERT INTO partner_items (id, company_id, company_name, partner_id, item_type, item_name, outsourcing_process_id, unit, unit_cost, memo, is_active, created_at, updated_at)
VALUES
  ('realistic-partner-item-factory-01', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-01', 'factory', '봉제', NULL, '벌', 4200, '주력 봉제 단가', true, now() - interval '210 days', now()),
  ('realistic-partner-item-factory-02', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-02', 'factory', '샘플 봉제', NULL, '벌', 5200, '샘플 단가', true, now() - interval '205 days', now()),
  ('realistic-partner-item-factory-03', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-03', 'factory', '리오더 봉제', NULL, '벌', 3900, '리오더 대량 단가', true, now() - interval '200 days', now()),
  ('realistic-partner-item-factory-04', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-04', 'factory', '외곽 봉제', NULL, '벌', 3700, '납기 변동 확인용', true, now() - interval '190 days', now()),
  ('realistic-partner-item-factory-05', 'company-sample-customer', '샘플 고객사', 'realistic-partner-factory-05', 'factory', '검수 강화 봉제', NULL, '벌', 4500, '검수 이슈 확인용', true, now() - interval '180 days', now()),
  ('realistic-partner-item-fabric-01', 'company-sample-customer', '샘플 고객사', 'realistic-partner-fabric-01', 'fabric', '면/린넨', NULL, 'yard', 3100, '기본 원단', true, now() - interval '185 days', now()),
  ('realistic-partner-item-fabric-02', 'company-sample-customer', '샘플 고객사', 'realistic-partner-fabric-02', 'fabric', '트윌/데님', NULL, 'yard', 4200, '두꺼운 원단', true, now() - interval '170 days', now()),
  ('realistic-partner-item-fabric-03', 'company-sample-customer', '샘플 고객사', 'realistic-partner-fabric-03', 'fabric', '니트/쭈리', NULL, 'yard', 3600, '니트류 원단', true, now() - interval '160 days', now()),
  ('realistic-partner-item-subsidiary-01', 'company-sample-customer', '샘플 고객사', 'realistic-partner-subsidiary-01', 'subsidiary', '라벨/단추/지퍼', NULL, '개', 160, '기본 부자재', true, now() - interval '175 days', now()),
  ('realistic-partner-item-subsidiary-02', 'company-sample-customer', '샘플 고객사', 'realistic-partner-subsidiary-02', 'subsidiary', '심지/고무줄', NULL, '개', 110, '보조 부자재', true, now() - interval '150 days', now()),
  ('realistic-partner-item-outsourcing-01', 'company-sample-customer', '샘플 고객사', 'realistic-partner-outsourcing-01', 'outsourcing', '나염', 'process-printing', '공정', 1800, '나염 외주', true, now() - interval '155 days', now()),
  ('realistic-partner-item-outsourcing-02', 'company-sample-customer', '샘플 고객사', 'realistic-partner-outsourcing-02', 'outsourcing', '자수', 'process-embroidery', '공정', 2200, '자수 외주', true, now() - interval '145 days', now());

-- =========================================
-- 3) 6개월 작업지시서 생성용 임시 테이블
-- =========================================

CREATE TEMP TABLE realistic_seed_workorders ON COMMIT DROP AS
WITH base AS (
  SELECT
    g AS idx,
    ((g - 1) % 15) + 1 AS product_index,
    (current_date - ((180 - floor(((g - 1) * 180.0) / 99.0))::int || ' days')::interval + ((g % 9) || ' hours')::interval)::timestamp AS created_at
  FROM generate_series(1, 100) AS g
), labeled AS (
  SELECT
    b.*,
    (ARRAY[
      '반팔 티셔츠', '오버핏 셔츠', '슬랙스', '플리츠 스커트', '셔츠 원피스',
      '테일러드 자켓', '트렌치 코트', '블라우스', '니트 조끼', '와이드 팬츠',
      '후드 집업', '데님 스커트', '롱 원피스', '린넨 셔츠', '크롭 자켓'
    ])[b.product_index] AS product_label,
    (ARRAY[
      'category:상의', 'category:상의', 'category:하의', 'category:하의', 'realistic-category:원피스',
      'category:아우터', 'category:아우터', 'category:상의', 'category:상의', 'category:하의',
      'category:아우터', 'category:하의', 'realistic-category:원피스', 'category:상의', 'category:아우터'
    ])[b.product_index] AS category1_id,
    (ARRAY[
      'category:상의:티셔츠', 'realistic-category:상의:셔츠', 'category:하의:팬츠', 'realistic-category:하의:스커트', 'realistic-category:원피스:셔츠',
      'category:아우터:자켓', 'realistic-category:아우터:코트', 'realistic-category:상의:블라우스', 'realistic-category:상의:조끼', 'category:하의:팬츠',
      'realistic-category:아우터:집업', 'realistic-category:하의:스커트', 'realistic-category:원피스:롱', 'realistic-category:상의:셔츠', 'category:아우터:자켓'
    ])[b.product_index] AS category2_id,
    (ARRAY[
      'category:상의:티셔츠:반팔', 'realistic-category:상의:셔츠:오버핏', 'category:하의:팬츠:슬랙스', 'realistic-category:하의:스커트:플리츠', 'realistic-category:원피스:셔츠:기본',
      'category:아우터:자켓:테일러드', 'realistic-category:아우터:코트:트렌치', 'realistic-category:상의:블라우스:기본', 'realistic-category:상의:조끼:니트', 'realistic-category:하의:팬츠:와이드',
      'realistic-category:아우터:집업:후드', 'realistic-category:하의:스커트:데님', 'realistic-category:원피스:롱:기본', 'realistic-category:상의:셔츠:린넨', 'realistic-category:아우터:자켓:크롭'
    ])[b.product_index] AS category3_id
  FROM base b
), rounded AS (
  SELECT
    l.*,
    row_number() OVER (PARTITION BY product_index ORDER BY idx) AS reorder_round,
    min(idx) OVER (PARTITION BY product_index) AS first_idx
  FROM labeled l
)
SELECT
  idx,
  'realistic-spec-' || lpad(idx::text, 3, '0') AS spec_id,
  'realistic-group-' || lpad(product_index::text, 2, '0') AS reorder_group_id,
  'realistic-spec-' || lpad(first_idx::text, 3, '0') AS first_spec_id,
  CASE
    WHEN reorder_round = 1 THEN product_label || ' 신규'
    ELSE product_label || ' 리오더'
  END AS title,
  product_index,
  product_label,
  category1_id,
  category2_id,
  category3_id,
  reorder_round,
  CASE
    WHEN idx % 12 IN (0, 1, 5, 7, 10) THEN 'completed'
    WHEN idx % 12 IN (2, 9) THEN 'inspection'
    WHEN idx % 12 IN (3, 11) THEN 'review_requested'
    WHEN idx % 12 = 8 THEN 'review_completed'
    WHEN idx % 12 = 6 THEN 'rejected'
    ELSE 'draft'
  END AS status,
  (idx % 12 = 6 OR idx % 17 = 0) AS is_rework,
  ('realistic-partner-factory-0' || (((idx - 1) % 5) + 1)::text) AS factory_partner_id,
  (ARRAY['빛가람 봉제 A', '나주 샘플실 B', '광주 봉제 C', '담양 생산 D', '목포 봉제 E'])[(((idx - 1) % 5) + 1)] AS factory_name,
  (20 + ((idx * 7) % 140))::integer AS quantity,
  (created_at + ((8 + (idx % 16)) || ' days')::interval)::date AS due_date,
  (2600 + ((idx % 5) * 450))::integer AS unit_labor_cost,
  (created_at + ((2 + (idx % 21)) || ' days')::interval)::timestamp AS raw_updated_at,
  created_at
FROM rounded;

-- =========================================
-- 3-1) 0.9.22434 통계 화면 검증용 고정 케이스
-- =========================================
-- 목적:
-- - 완료 작업지시서 → 발주수량 상위 5개 검증
-- - 리오더 → reorder_round가 높은 순서 TOP5 검증
-- - 불량 작업지시서 → rejected/is_rework 기준 TOP5 검증
-- - 업체별 납기/검수 지표 → 납기 지연/검수 이슈가 보이는지 검증
-- 주의:
-- - 실제 schema에 없는 임시 필드는 만들지 않는다.
-- - id는 realistic-spec-9xx 대역을 사용해 기존 100개 자동 생성 데이터와 충돌하지 않게 한다.

INSERT INTO realistic_seed_workorders (
  idx, spec_id, reorder_group_id, first_spec_id, title, product_index, product_label,
  category1_id, category2_id, category3_id, reorder_round, status, is_rework,
  factory_partner_id, factory_name, quantity, due_date, unit_labor_cost, raw_updated_at, created_at
)
VALUES
  -- 발주수량 상위 TOP5와 리오더 차수 TOP5를 동시에 검증하는 리오더 그룹
  (901, 'realistic-spec-901', 'realistic-group-top-linen-shirt', 'realistic-spec-901', '통계 검증 린넨 셔츠 1차', 14, '통계 검증 린넨 셔츠', 'category:상의', 'realistic-category:상의:셔츠', 'realistic-category:상의:셔츠:린넨', 1, 'completed', false, 'realistic-partner-factory-03', '광주 봉제 C', 260, current_date - interval '18 days', 3900, current_timestamp - interval '10 days', current_timestamp - interval '26 days'),
  (902, 'realistic-spec-902', 'realistic-group-top-linen-shirt', 'realistic-spec-901', '통계 검증 린넨 셔츠 2차 리오더', 14, '통계 검증 린넨 셔츠', 'category:상의', 'realistic-category:상의:셔츠', 'realistic-category:상의:셔츠:린넨', 2, 'completed', false, 'realistic-partner-factory-03', '광주 봉제 C', 320, current_date - interval '14 days', 3900, current_timestamp - interval '8 days', current_timestamp - interval '22 days'),
  (903, 'realistic-spec-903', 'realistic-group-top-linen-shirt', 'realistic-spec-901', '통계 검증 린넨 셔츠 3차 리오더', 14, '통계 검증 린넨 셔츠', 'category:상의', 'realistic-category:상의:셔츠', 'realistic-category:상의:셔츠:린넨', 3, 'completed', false, 'realistic-partner-factory-03', '광주 봉제 C', 380, current_date - interval '10 days', 3900, current_timestamp - interval '6 days', current_timestamp - interval '18 days'),
  (904, 'realistic-spec-904', 'realistic-group-top-linen-shirt', 'realistic-spec-901', '통계 검증 린넨 셔츠 4차 리오더', 14, '통계 검증 린넨 셔츠', 'category:상의', 'realistic-category:상의:셔츠', 'realistic-category:상의:셔츠:린넨', 4, 'completed', false, 'realistic-partner-factory-03', '광주 봉제 C', 460, current_date - interval '6 days', 3900, current_timestamp - interval '4 days', current_timestamp - interval '14 days'),
  (905, 'realistic-spec-905', 'realistic-group-top-linen-shirt', 'realistic-spec-901', '통계 검증 린넨 셔츠 5차 리오더', 14, '통계 검증 린넨 셔츠', 'category:상의', 'realistic-category:상의:셔츠', 'realistic-category:상의:셔츠:린넨', 5, 'completed', false, 'realistic-partner-factory-03', '광주 봉제 C', 520, current_date - interval '3 days', 3900, current_timestamp - interval '2 days', current_timestamp - interval '9 days'),
  (906, 'realistic-spec-906', 'realistic-group-top-linen-shirt', 'realistic-spec-901', '통계 검증 린넨 셔츠 6차 리오더', 14, '통계 검증 린넨 셔츠', 'category:상의', 'realistic-category:상의:셔츠', 'realistic-category:상의:셔츠:린넨', 6, 'completed', false, 'realistic-partner-factory-03', '광주 봉제 C', 640, current_date - interval '1 days', 3900, current_timestamp - interval '12 hours', current_timestamp - interval '4 days'),

  -- 리오더 차수 TOP5 보조 그룹. 같은 차수에서는 발주수량 보조 정렬을 확인한다.
  (911, 'realistic-spec-911', 'realistic-group-top-wide-pants', 'realistic-spec-911', '통계 검증 와이드 팬츠 1차', 10, '통계 검증 와이드 팬츠', 'category:하의', 'category:하의:팬츠', 'realistic-category:하의:팬츠:와이드', 1, 'completed', false, 'realistic-partner-factory-01', '빛가람 봉제 A', 180, current_date - interval '20 days', 4200, current_timestamp - interval '16 days', current_timestamp - interval '28 days'),
  (912, 'realistic-spec-912', 'realistic-group-top-wide-pants', 'realistic-spec-911', '통계 검증 와이드 팬츠 2차 리오더', 10, '통계 검증 와이드 팬츠', 'category:하의', 'category:하의:팬츠', 'realistic-category:하의:팬츠:와이드', 2, 'completed', false, 'realistic-partner-factory-01', '빛가람 봉제 A', 240, current_date - interval '12 days', 4200, current_timestamp - interval '10 days', current_timestamp - interval '18 days'),
  (913, 'realistic-spec-913', 'realistic-group-top-wide-pants', 'realistic-spec-911', '통계 검증 와이드 팬츠 3차 리오더', 10, '통계 검증 와이드 팬츠', 'category:하의', 'category:하의:팬츠', 'realistic-category:하의:팬츠:와이드', 3, 'completed', false, 'realistic-partner-factory-01', '빛가람 봉제 A', 360, current_date - interval '7 days', 4200, current_timestamp - interval '5 days', current_timestamp - interval '11 days'),
  (914, 'realistic-spec-914', 'realistic-group-top-wide-pants', 'realistic-spec-911', '통계 검증 와이드 팬츠 4차 리오더', 10, '통계 검증 와이드 팬츠', 'category:하의', 'category:하의:팬츠', 'realistic-category:하의:팬츠:와이드', 4, 'completed', false, 'realistic-partner-factory-01', '빛가람 봉제 A', 500, current_date - interval '2 days', 4200, current_timestamp - interval '1 days', current_timestamp - interval '5 days'),

  (921, 'realistic-spec-921', 'realistic-group-top-crop-jacket', 'realistic-spec-921', '통계 검증 크롭 자켓 1차', 15, '통계 검증 크롭 자켓', 'category:아우터', 'category:아우터:자켓', 'realistic-category:아우터:자켓:크롭', 1, 'completed', false, 'realistic-partner-factory-02', '나주 샘플실 B', 140, current_date - interval '21 days', 5200, current_timestamp - interval '18 days', current_timestamp - interval '29 days'),
  (922, 'realistic-spec-922', 'realistic-group-top-crop-jacket', 'realistic-spec-921', '통계 검증 크롭 자켓 2차 리오더', 15, '통계 검증 크롭 자켓', 'category:아우터', 'category:아우터:자켓', 'realistic-category:아우터:자켓:크롭', 2, 'completed', false, 'realistic-partner-factory-02', '나주 샘플실 B', 260, current_date - interval '13 days', 5200, current_timestamp - interval '11 days', current_timestamp - interval '20 days'),
  (923, 'realistic-spec-923', 'realistic-group-top-crop-jacket', 'realistic-spec-921', '통계 검증 크롭 자켓 3차 리오더', 15, '통계 검증 크롭 자켓', 'category:아우터', 'category:아우터:자켓', 'realistic-category:아우터:자켓:크롭', 3, 'completed', false, 'realistic-partner-factory-02', '나주 샘플실 B', 420, current_date - interval '4 days', 5200, current_timestamp - interval '2 days', current_timestamp - interval '8 days'),

  (931, 'realistic-spec-931', 'realistic-group-top-shirt-dress', 'realistic-spec-931', '통계 검증 셔츠 원피스 1차', 5, '통계 검증 셔츠 원피스', 'realistic-category:원피스', 'realistic-category:원피스:셔츠', 'realistic-category:원피스:셔츠:기본', 1, 'completed', false, 'realistic-partner-factory-04', '담양 생산 D', 300, current_date - interval '17 days', 3700, current_timestamp - interval '13 days', current_timestamp - interval '24 days'),
  (932, 'realistic-spec-932', 'realistic-group-top-shirt-dress', 'realistic-spec-931', '통계 검증 셔츠 원피스 2차 리오더', 5, '통계 검증 셔츠 원피스', 'realistic-category:원피스', 'realistic-category:원피스:셔츠', 'realistic-category:원피스:셔츠:기본', 2, 'completed', false, 'realistic-partner-factory-04', '담양 생산 D', 410, current_date - interval '5 days', 3700, current_timestamp - interval '3 days', current_timestamp - interval '7 days'),

  -- 납기 지연 검증용. due_date는 지났고 status는 완료가 아니어야 업체별 납기 지연에 잡힌다.
  (941, 'realistic-spec-941', 'realistic-group-delay-hoodie', 'realistic-spec-941', '통계 검증 후드 집업 납기 지연', 11, '통계 검증 후드 집업', 'category:아우터', 'realistic-category:아우터:집업', 'realistic-category:아우터:집업:후드', 1, 'inspection', false, 'realistic-partner-factory-04', '담양 생산 D', 210, current_date - interval '9 days', 3700, current_timestamp - interval '2 days', current_timestamp - interval '15 days'),
  (942, 'realistic-spec-942', 'realistic-group-delay-pleats-skirt', 'realistic-spec-942', '통계 검증 플리츠 스커트 납기 지연', 4, '통계 검증 플리츠 스커트', 'category:하의', 'realistic-category:하의:스커트', 'realistic-category:하의:스커트:플리츠', 1, 'review_requested', false, 'realistic-partner-factory-05', '목포 봉제 E', 175, current_date - interval '6 days', 4500, current_timestamp - interval '1 days', current_timestamp - interval '12 days'),

  -- 불량 작업지시서 TOP5 검증용. title을 일부 반복해 COUNT 기준을 확인한다.
  (951, 'realistic-spec-951', 'realistic-group-defect-blouse-a', 'realistic-spec-951', '통계 검증 블라우스 검수 불량', 8, '통계 검증 블라우스', 'category:상의', 'realistic-category:상의:블라우스', 'realistic-category:상의:블라우스:기본', 1, 'rejected', true, 'realistic-partner-factory-05', '목포 봉제 E', 95, current_date - interval '8 days', 4500, current_timestamp - interval '1 days', current_timestamp - interval '10 days'),
  (952, 'realistic-spec-952', 'realistic-group-defect-blouse-b', 'realistic-spec-952', '통계 검증 블라우스 검수 불량', 8, '통계 검증 블라우스', 'category:상의', 'realistic-category:상의:블라우스', 'realistic-category:상의:블라우스:기본', 1, 'rejected', true, 'realistic-partner-factory-05', '목포 봉제 E', 110, current_date - interval '4 days', 4500, current_timestamp - interval '20 hours', current_timestamp - interval '6 days'),
  (953, 'realistic-spec-953', 'realistic-group-defect-blouse-c', 'realistic-spec-953', '통계 검증 블라우스 검수 불량', 8, '통계 검증 블라우스', 'category:상의', 'realistic-category:상의:블라우스', 'realistic-category:상의:블라우스:기본', 1, 'rejected', true, 'realistic-partner-factory-05', '목포 봉제 E', 125, current_date - interval '2 days', 4500, current_timestamp - interval '12 hours', current_timestamp - interval '3 days'),
  (954, 'realistic-spec-954', 'realistic-group-defect-denim-skirt-a', 'realistic-spec-954', '통계 검증 데님 스커트 검수 불량', 12, '통계 검증 데님 스커트', 'category:하의', 'realistic-category:하의:스커트', 'realistic-category:하의:스커트:데님', 1, 'rejected', true, 'realistic-partner-factory-02', '나주 샘플실 B', 130, current_date - interval '3 days', 5200, current_timestamp - interval '10 hours', current_timestamp - interval '4 days'),
  (955, 'realistic-spec-955', 'realistic-group-defect-denim-skirt-b', 'realistic-spec-955', '통계 검증 데님 스커트 검수 불량', 12, '통계 검증 데님 스커트', 'category:하의', 'realistic-category:하의:스커트', 'realistic-category:하의:스커트:데님', 1, 'rejected', true, 'realistic-partner-factory-02', '나주 샘플실 B', 150, current_date - interval '1 days', 5200, current_timestamp - interval '6 hours', current_timestamp - interval '2 days');

-- =========================================
-- 4) 작업지시서 / 발주 / 자재 / 외주 / 메모
-- =========================================

INSERT INTO spec_sheets (
  id, company_id, company_name, title, status, work_order_kind, reorder_group_id, reorder_round, parent_spec_sheet_id,
  is_rework, category1_id, category2_id, category3_id, is_active, delete_status, purge_status, payload, created_at, updated_at, deleted_at
)
SELECT
  spec_id,
  'company-sample-customer',
  '샘플 고객사',
  title,
  status,
  'production',
  reorder_group_id,
  reorder_round,
  CASE WHEN reorder_round > 1 THEN first_spec_id ELSE NULL END,
  is_rework,
  category1_id,
  category2_id,
  category3_id,
  CASE WHEN idx % 37 = 0 THEN false ELSE true END,
  CASE WHEN idx % 37 = 0 THEN 'trashed' ELSE 'active' END,
  CASE WHEN idx % 37 = 0 THEN 'pending' ELSE 'none' END,
  jsonb_build_object(
    'productName', product_label,
    'categoryLabel', product_label,
    'category', product_label,
    'category1Label', COALESCE((SELECT name FROM item_categories WHERE id = category1_id AND company_id = 'company-sample-customer'), '분류 미지정'),
    'category2Label', COALESCE((SELECT name FROM item_categories WHERE id = category2_id AND company_id = 'company-sample-customer'), '분류 미지정'),
    'category3Label', COALESCE((SELECT name FROM item_categories WHERE id = category3_id AND company_id = 'company-sample-customer'), '분류 미지정'),
    'demoPreset', 'realistic-small',
    'reorderRound', reorder_round,
    'expectedQuantity', quantity,
    'factoryName', factory_name
  ),
  created_at,
  LEAST(raw_updated_at, (current_timestamp - interval '1 hour')::timestamp),
  CASE WHEN idx % 37 = 0 THEN created_at + interval '45 days' ELSE NULL END
FROM realistic_seed_workorders;

INSERT INTO orders (id, company_id, company_name, spec_sheet_id, source_order_entry_id, factory_partner_id, factory_name, quantity, due_date, labor_cost, loss_cost, status, is_active, deleted_at, created_at, updated_at)
SELECT
  'realistic-order-' || lpad(idx::text, 3, '0'),
  'company-sample-customer',
  '샘플 고객사',
  spec_id,
  'realistic-entry-' || lpad(idx::text, 3, '0'),
  factory_partner_id,
  factory_name,
  quantity,
  to_char(due_date, 'YYYY-MM-DD'),
  quantity * unit_labor_cost,
  (quantity * (120 + ((idx % 7) * 35)))::integer,
  CASE
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'inspection' THEN 'inspection'
    WHEN status = 'review_requested' THEN 'requested'
    WHEN status = 'review_completed' THEN 'ordered'
    WHEN status = 'rejected' THEN 'cancelled'
    ELSE 'draft'
  END,
  CASE WHEN idx % 37 = 0 THEN false ELSE true END,
  CASE WHEN idx % 37 = 0 THEN created_at + interval '45 days' ELSE NULL END,
  created_at + interval '1 day',
  LEAST(raw_updated_at + interval '1 day', current_timestamp - interval '30 minutes')
FROM realistic_seed_workorders;

INSERT INTO spec_sheet_materials (id, company_id, company_name, spec_sheet_id, source_material_id, material_type, name, vendor, quantity, unit, unit_cost, total_cost, status, payload, is_active, deleted_at, created_at, updated_at)
SELECT
  'realistic-material-' || lpad(w.idx::text, 3, '0') || '-' || slot,
  'company-sample-customer',
  '샘플 고객사',
  w.spec_id,
  'realistic-source-material-' || lpad(w.idx::text, 3, '0') || '-' || slot,
  CASE WHEN slot = 1 THEN 'fabric' ELSE 'subsidiary' END,
  CASE
    WHEN slot = 1 THEN (ARRAY['30수 싱글', '린넨 혼방', '트윌', '데님', '쭈리', '코튼 포플린'])[1 + (w.idx % 6)]
    ELSE (ARRAY['라벨', '단추', '지퍼', '고무줄', '심지'])[1 + (w.idx % 5)]
  END,
  CASE
    WHEN slot = 1 THEN (ARRAY['남평 원단상사', '서울 원단창고', '동대문 니트원단'])[1 + (w.idx % 3)]
    ELSE (ARRAY['라벨앤버튼', '부자재팩토리'])[1 + (w.idx % 2)]
  END,
  CASE WHEN slot = 1 THEN round((w.quantity * (0.85 + ((w.idx % 5) * 0.08)))::numeric, 2) ELSE w.quantity::numeric END,
  CASE WHEN slot = 1 THEN 'yard' ELSE '개' END,
  CASE WHEN slot = 1 THEN (2800 + ((w.idx % 6) * 260)) ELSE (80 + ((w.idx % 5) * 25)) END,
  CASE WHEN slot = 1 THEN round((w.quantity * (0.85 + ((w.idx % 5) * 0.08)) * (2800 + ((w.idx % 6) * 260)))::numeric, 0) ELSE (w.quantity * (80 + ((w.idx % 5) * 25)))::numeric END,
  CASE WHEN w.status = 'completed' THEN 'used' ELSE 'requested' END,
  jsonb_build_object('demoPreset', 'realistic-small'),
  true,
  NULL,
  w.created_at + interval '2 days',
  LEAST(w.raw_updated_at + interval '2 days', current_timestamp - interval '20 minutes')
FROM realistic_seed_workorders w
CROSS JOIN generate_series(1, 2) AS slot;

INSERT INTO spec_sheet_outsourcing_lines (id, company_id, company_name, spec_sheet_id, source_outsourcing_id, process, vendor, quantity, unit, unit_cost, total_cost, status, payload, is_active, deleted_at, created_at, updated_at)
SELECT
  'realistic-outsourcing-' || lpad(idx::text, 3, '0'),
  'company-sample-customer',
  '샘플 고객사',
  spec_id,
  'realistic-source-outsourcing-' || lpad(idx::text, 3, '0'),
  CASE WHEN idx % 2 = 0 THEN '나염' ELSE '자수' END,
  CASE WHEN idx % 2 = 0 THEN '나염공방 프린트' ELSE '자수작업실 스티치' END,
  quantity::numeric,
  '공정',
  CASE WHEN idx % 2 = 0 THEN 1800 ELSE 2200 END,
  quantity * CASE WHEN idx % 2 = 0 THEN 1800 ELSE 2200 END,
  CASE WHEN status = 'completed' THEN 'completed' ELSE 'requested' END,
  jsonb_build_object('demoPreset', 'realistic-small'),
  true,
  NULL,
  created_at + interval '3 days',
  LEAST(raw_updated_at + interval '3 days', current_timestamp - interval '10 minutes')
FROM realistic_seed_workorders
WHERE idx % 3 = 0 OR product_index IN (1, 6, 11);

INSERT INTO memos (id, company_id, company_name, order_id, parent_id, body, author_id, is_active, delete_status, purge_status, deleted_at, created_at, updated_at)
SELECT
  'realistic-memo-' || lpad(idx::text, 3, '0'),
  'company-sample-customer',
  '샘플 고객사',
  spec_id,
  NULL,
  CASE
    WHEN status = 'rejected' THEN product_label || ' 검수 시 봉제선/부자재 위치 재확인 필요.'
    WHEN is_rework THEN product_label || ' 리오더 수정사항 반영 확인.'
    WHEN status = 'completed' THEN product_label || ' 검수 완료. 생산 기록 확인.'
    ELSE product_label || ' 진행 메모. 원단/부자재 입고 일정 확인.'
  END,
  CASE WHEN idx % 2 = 0 THEN 'user-sample-designer' ELSE 'user-sample-inspector' END,
  CASE WHEN idx % 41 = 0 THEN false ELSE true END,
  CASE WHEN idx % 41 = 0 THEN 'trashed' ELSE 'active' END,
  CASE WHEN idx % 41 = 0 THEN 'pending' ELSE 'none' END,
  CASE WHEN idx % 41 = 0 THEN created_at + interval '60 days' ELSE NULL END,
  created_at + interval '4 days',
  LEAST(raw_updated_at + interval '4 days', current_timestamp - interval '5 minutes')
FROM realistic_seed_workorders
WHERE idx % 2 = 0 OR status IN ('rejected', 'inspection');

-- =========================================
-- 5) R2 업로드 테스트용 attachments metadata small preset
-- =========================================

INSERT INTO attachments (id, company_id, company_name, order_id, type, storage_key, original_name, mime_type, size_bytes, author_id, is_primary, thumbnail_key, preview_url, is_active, deleted_at, deleted_by, purge_after_at, created_at, updated_at)
SELECT
  'realistic-attachment-' || lpad(w.idx::text, 3, '0') || '-' || slot,
  'company-sample-customer',
  '샘플 고객사',
  w.spec_id,
  CASE
    WHEN slot = 1 THEN 'design'
    WHEN slot = 3 THEN 'memo'
    ELSE 'file'
  END,
  CASE
    WHEN slot = 1 THEN 'workorders/' || w.spec_id || '/design/realistic-attachment-' || lpad(w.idx::text, 3, '0') || '-' || slot || '.png'
    WHEN slot = 3 THEN 'workorders/' || w.spec_id || '/memos/realistic-attachment-' || lpad(w.idx::text, 3, '0') || '-' || slot || '.png'
    WHEN slot = 4 THEN 'workorders/' || w.spec_id || '/attachments/realistic-attachment-' || lpad(w.idx::text, 3, '0') || '-' || slot || '.pdf'
    ELSE 'workorders/' || w.spec_id || '/attachments/realistic-attachment-' || lpad(w.idx::text, 3, '0') || '-' || slot || '.pdf'
  END,
  CASE
    WHEN slot = 1 THEN w.product_label || '_디자인_' || lpad(w.idx::text, 3, '0') || '.png'
    WHEN slot = 3 THEN w.product_label || '_메모이미지_' || lpad(w.idx::text, 3, '0') || '.png'
    WHEN slot = 4 THEN w.product_label || '_대용량자료_' || lpad(w.idx::text, 3, '0') || '.pdf'
    ELSE w.product_label || '_작업자료_' || lpad(w.idx::text, 3, '0') || '.pdf'
  END,
  CASE
    WHEN slot IN (1, 3) THEN 'image/png'
    WHEN slot = 4 THEN 'application/pdf'
    ELSE 'application/pdf'
  END,
  CASE
    WHEN slot = 1 THEN (40960 + ((w.idx % 20) * 12288))::bigint
    WHEN slot = 2 THEN (184320 + ((w.idx % 18) * 61440))::bigint
    WHEN slot = 3 THEN (40960 + ((w.idx % 10) * 15360))::bigint
    ELSE (4194304 + ((w.idx % 4) * 524288))::bigint
  END,
  CASE WHEN slot = 1 THEN 'user-sample-designer' ELSE 'user-sample-admin' END,
  (slot = 1),
  CASE WHEN slot = 1 THEN 'workorders/' || w.spec_id || '/design/realistic-attachment-' || lpad(w.idx::text, 3, '0') || '-' || slot || '-thumb.png' ELSE NULL END,
  NULL,
  CASE WHEN (w.idx + slot) % 17 = 0 THEN false ELSE true END,
  CASE WHEN (w.idx + slot) % 17 = 0 THEN w.created_at + interval '70 days' ELSE NULL END,
  CASE WHEN (w.idx + slot) % 17 = 0 THEN 'user-sample-admin' ELSE NULL END,
  CASE WHEN (w.idx + slot) % 17 = 0 THEN w.created_at + interval '100 days' ELSE NULL END,
  w.created_at + (slot || ' days')::interval,
  LEAST(w.raw_updated_at + (slot || ' days')::interval, current_timestamp - interval '2 minutes')
FROM realistic_seed_workorders w
CROSS JOIN generate_series(1, 4) AS slot
WHERE
  slot = 1
  OR (slot = 2 AND w.idx % 2 = 0)
  OR (slot = 3 AND w.idx % 3 = 0)
  OR (slot = 4 AND w.idx % 25 = 0);

INSERT INTO attachment_trash_items (id, company_id, company_name, attachment_id, order_id, storage_key, thumbnail_key, original_name, mime_type, size_bytes, deleted_by, deleted_at, purge_after_at, purge_status, created_at, updated_at)
SELECT
  'realistic-trash-' || a.id,
  a.company_id,
  a.company_name,
  a.id,
  a.order_id,
  a.storage_key,
  a.thumbnail_key,
  a.original_name,
  a.mime_type,
  COALESCE(a.size_bytes, 0),
  COALESCE(a.deleted_by, 'user-sample-admin'),
  COALESCE(a.deleted_at, now() - interval '10 days'),
  COALESCE(a.purge_after_at, now() + interval '20 days'),
  CASE
    WHEN right(a.id, 1) = '4' THEN 'failed'
    WHEN right(a.id, 1) = '2' THEN 'purge_requested'
    ELSE 'pending'
  END,
  COALESCE(a.deleted_at, now() - interval '10 days'),
  now()
FROM attachments a
WHERE a.id LIKE 'realistic-attachment-%'
  AND (a.deleted_at IS NOT NULL OR COALESCE(a.is_active, true) = false);

-- =========================================
-- 6) daily/monthly summary stats 보강
-- =========================================

INSERT INTO company_workorder_daily_stats (company_id, stats_date, created_workorder_count, active_workorder_count, completed_workorder_count, trashed_workorder_count, reorder_workorder_count, order_count, order_quantity_total, labor_cost_total, loss_cost_total, memo_count, attachment_count)
SELECT
  'company-sample-customer',
  d.stats_date,
  COUNT(s.id)::integer,
  COUNT(s.id) FILTER (WHERE COALESCE(s.is_active, true) = true AND s.deleted_at IS NULL)::integer,
  COUNT(s.id) FILTER (WHERE s.status = 'completed')::integer,
  COUNT(s.id) FILTER (WHERE s.deleted_at IS NOT NULL OR COALESCE(s.is_active, true) = false)::integer,
  COUNT(s.id) FILTER (WHERE COALESCE(s.reorder_round, 0) > 1)::integer,
  COUNT(o.id)::integer,
  COALESCE(SUM(o.quantity), 0)::numeric(14, 2),
  COALESCE(SUM(o.labor_cost), 0)::numeric(14, 2),
  COALESCE(SUM(o.loss_cost), 0)::numeric(14, 2),
  COUNT(m.id)::integer,
  COUNT(a.id)::integer
FROM (
  SELECT generate_series(current_date - interval '180 days', current_date, interval '1 day')::date AS stats_date
) d
LEFT JOIN spec_sheets s ON s.company_id = 'company-sample-customer' AND s.id LIKE 'realistic-spec-%' AND s.created_at::date = d.stats_date
LEFT JOIN orders o ON o.spec_sheet_id = s.id AND o.id LIKE 'realistic-order-%'
LEFT JOIN memos m ON m.order_id = s.id AND m.id LIKE 'realistic-memo-%'
LEFT JOIN attachments a ON a.order_id = s.id AND a.id LIKE 'realistic-attachment-%'
GROUP BY d.stats_date
HAVING COUNT(s.id) > 0
ON CONFLICT (company_id, stats_date) DO UPDATE SET
  created_workorder_count = EXCLUDED.created_workorder_count,
  active_workorder_count = EXCLUDED.active_workorder_count,
  completed_workorder_count = EXCLUDED.completed_workorder_count,
  trashed_workorder_count = EXCLUDED.trashed_workorder_count,
  reorder_workorder_count = EXCLUDED.reorder_workorder_count,
  order_count = EXCLUDED.order_count,
  order_quantity_total = EXCLUDED.order_quantity_total,
  labor_cost_total = EXCLUDED.labor_cost_total,
  loss_cost_total = EXCLUDED.loss_cost_total,
  memo_count = EXCLUDED.memo_count,
  attachment_count = EXCLUDED.attachment_count,
  updated_at = now();

INSERT INTO company_workorder_monthly_stats (company_id, stats_month, created_workorder_count, active_workorder_count, completed_workorder_count, trashed_workorder_count, reorder_workorder_count, order_count, order_quantity_total, labor_cost_total, loss_cost_total, memo_count, attachment_count)
SELECT
  'company-sample-customer',
  date_trunc('month', s.created_at)::date AS stats_month,
  COUNT(s.id)::integer,
  COUNT(s.id) FILTER (WHERE COALESCE(s.is_active, true) = true AND s.deleted_at IS NULL)::integer,
  COUNT(s.id) FILTER (WHERE s.status = 'completed')::integer,
  COUNT(s.id) FILTER (WHERE s.deleted_at IS NOT NULL OR COALESCE(s.is_active, true) = false)::integer,
  COUNT(s.id) FILTER (WHERE COALESCE(s.reorder_round, 0) > 1)::integer,
  COUNT(o.id)::integer,
  COALESCE(SUM(o.quantity), 0)::numeric(14, 2),
  COALESCE(SUM(o.labor_cost), 0)::numeric(14, 2),
  COALESCE(SUM(o.loss_cost), 0)::numeric(14, 2),
  COUNT(m.id)::integer,
  COUNT(a.id)::integer
FROM spec_sheets s
LEFT JOIN orders o ON o.spec_sheet_id = s.id AND o.id LIKE 'realistic-order-%'
LEFT JOIN memos m ON m.order_id = s.id AND m.id LIKE 'realistic-memo-%'
LEFT JOIN attachments a ON a.order_id = s.id AND a.id LIKE 'realistic-attachment-%'
WHERE s.company_id = 'company-sample-customer'
  AND s.id LIKE 'realistic-spec-%'
GROUP BY date_trunc('month', s.created_at)::date
ON CONFLICT (company_id, stats_month) DO UPDATE SET
  created_workorder_count = EXCLUDED.created_workorder_count,
  active_workorder_count = EXCLUDED.active_workorder_count,
  completed_workorder_count = EXCLUDED.completed_workorder_count,
  trashed_workorder_count = EXCLUDED.trashed_workorder_count,
  reorder_workorder_count = EXCLUDED.reorder_workorder_count,
  order_count = EXCLUDED.order_count,
  order_quantity_total = EXCLUDED.order_quantity_total,
  labor_cost_total = EXCLUDED.labor_cost_total,
  loss_cost_total = EXCLUDED.loss_cost_total,
  memo_count = EXCLUDED.memo_count,
  attachment_count = EXCLUDED.attachment_count,
  updated_at = now();

INSERT INTO company_storage_daily_stats (company_id, stats_date, active_attachment_count, active_attachment_bytes, trash_attachment_count, trash_attachment_bytes, purge_requested_count, purge_failed_count, purged_count, purged_bytes, thumbnail_count, logical_attachment_count, physical_attachment_bytes)
SELECT
  'company-sample-customer',
  current_date,
  COUNT(*) FILTER (WHERE a.deleted_at IS NULL AND COALESCE(a.is_active, true) = true)::integer,
  COALESCE(SUM(COALESCE(a.size_bytes, 0)) FILTER (WHERE a.deleted_at IS NULL AND COALESCE(a.is_active, true) = true), 0)::bigint,
  COUNT(*) FILTER (WHERE a.deleted_at IS NOT NULL OR COALESCE(a.is_active, true) = false)::integer,
  COALESCE(SUM(COALESCE(a.size_bytes, 0)) FILTER (WHERE a.deleted_at IS NOT NULL OR COALESCE(a.is_active, true) = false), 0)::bigint,
  COUNT(t.id) FILTER (WHERE t.purge_status = 'purge_requested')::integer,
  COUNT(t.id) FILTER (WHERE t.purge_status = 'failed')::integer,
  COUNT(t.id) FILTER (WHERE t.purge_status = 'purged')::integer,
  COALESCE(SUM(t.size_bytes) FILTER (WHERE t.purge_status = 'purged'), 0)::bigint,
  COUNT(*) FILTER (WHERE a.thumbnail_key IS NOT NULL)::integer,
  COUNT(*)::integer,
  COALESCE(SUM(COALESCE(a.size_bytes, 0)), 0)::bigint
FROM attachments a
LEFT JOIN attachment_trash_items t ON t.attachment_id = a.id
WHERE a.company_id = 'company-sample-customer'
  AND a.id LIKE 'realistic-attachment-%'
ON CONFLICT (company_id, stats_date) DO UPDATE SET
  active_attachment_count = EXCLUDED.active_attachment_count,
  active_attachment_bytes = EXCLUDED.active_attachment_bytes,
  trash_attachment_count = EXCLUDED.trash_attachment_count,
  trash_attachment_bytes = EXCLUDED.trash_attachment_bytes,
  purge_requested_count = EXCLUDED.purge_requested_count,
  purge_failed_count = EXCLUDED.purge_failed_count,
  purged_count = EXCLUDED.purged_count,
  purged_bytes = EXCLUDED.purged_bytes,
  thumbnail_count = EXCLUDED.thumbnail_count,
  logical_attachment_count = EXCLUDED.logical_attachment_count,
  physical_attachment_bytes = EXCLUDED.physical_attachment_bytes,
  updated_at = now();

COMMIT;

SELECT
  'realistic seed 0.9.2227 / stats test 0.9.224341 applied' AS result,
  (SELECT COUNT(*) FROM spec_sheets WHERE id LIKE 'realistic-spec-%') AS spec_sheet_count,
  (SELECT COUNT(*) FROM orders WHERE id LIKE 'realistic-order-%') AS order_count,
  (SELECT COUNT(*) FROM partners WHERE id LIKE 'realistic-partner-%') AS partner_count,
  (SELECT COUNT(*) FROM attachments WHERE id LIKE 'realistic-attachment-%') AS attachment_metadata_count,
  (SELECT COUNT(*) FROM attachments WHERE id LIKE 'realistic-attachment-9%') AS stats_fixture_attachment_count,
  (SELECT COUNT(*) FROM attachments WHERE id LIKE 'realistic-attachment-%' AND storage_key LIKE ('workorders/' || order_id || '/%')) AS matched_storage_key_count,
  (SELECT ROUND(COALESCE(SUM(size_bytes), 0) / 1024.0 / 1024.0, 2) FROM attachments WHERE id LIKE 'realistic-attachment-%') AS attachment_metadata_mb,
  (SELECT COUNT(*) FROM attachment_trash_items WHERE id LIKE 'realistic-trash-%') AS trash_item_count,
  (SELECT COUNT(*) FROM memos WHERE id LIKE 'realistic-memo-%') AS memo_count;
