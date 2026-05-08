-- PeaceByPiece 0.9.2071
-- 통계 화면 확인용 개발 seed 데이터
-- 실행 전제: db/schema/full_reset.sql 실행 후 샘플 고객사(company-sample-customer)가 존재하는 개발 DB
-- 운영 DB 실행 금지

BEGIN;

-- 기존 0.9.2071 demo seed만 제거한다. full reset 이후 재실행해도 같은 결과가 나오도록 id prefix를 고정한다.
DELETE FROM attachment_trash_items WHERE attachment_id LIKE 'stats-demo-%';
DELETE FROM attachments WHERE id LIKE 'stats-demo-%';
DELETE FROM orders WHERE id LIKE 'stats-demo-%';
DELETE FROM spec_sheets WHERE id LIKE 'stats-demo-%';
DELETE FROM partner_items WHERE id LIKE 'stats-demo-%';
DELETE FROM partners WHERE id LIKE 'stats-demo-%';
DELETE FROM company_workorder_daily_stats WHERE company_id = 'company-sample-customer' AND stats_date >= current_date - interval '30 days';
DELETE FROM company_workorder_monthly_stats WHERE company_id = 'company-sample-customer' AND stats_month = date_trunc('month', current_date)::date;
DELETE FROM company_storage_daily_stats WHERE company_id = 'company-sample-customer' AND stats_date >= current_date - interval '30 days';

INSERT INTO partners (id, company_id, company_name, name, contact_person, contact, memo, is_active, created_at, updated_at)
VALUES
  ('stats-demo-partner-factory-a', 'company-sample-customer', '샘플 고객사', '데모 봉제공장 A', '김공장', '010-1000-1001', '통계 확인용 공장', true, now() - interval '25 days', now() - interval '1 day'),
  ('stats-demo-partner-factory-b', 'company-sample-customer', '샘플 고객사', '데모 봉제공장 B', '박공장', '010-1000-1002', '통계 확인용 공장', true, now() - interval '22 days', now() - interval '2 days'),
  ('stats-demo-partner-fabric-a', 'company-sample-customer', '샘플 고객사', '데모 원단처 A', '이원단', '010-1000-2001', '통계 확인용 원단처', true, now() - interval '20 days', now() - interval '3 days'),
  ('stats-demo-partner-fabric-b', 'company-sample-customer', '샘플 고객사', '데모 원단처 B', '최원단', '010-1000-2002', '통계 확인용 원단처', true, now() - interval '18 days', now() - interval '4 days'),
  ('stats-demo-partner-subsidiary-a', 'company-sample-customer', '샘플 고객사', '데모 부자재처 A', '정부자재', '010-1000-3001', '통계 확인용 부자재처', true, now() - interval '17 days', now() - interval '5 days'),
  ('stats-demo-partner-outsourcing-a', 'company-sample-customer', '샘플 고객사', '데모 나염 외주처', '오나염', '010-1000-4001', '통계 확인용 외주처', true, now() - interval '16 days', now() - interval '6 days'),
  ('stats-demo-partner-outsourcing-b', 'company-sample-customer', '샘플 고객사', '데모 자수 외주처', '한자수', '010-1000-4002', '통계 확인용 외주처', true, now() - interval '14 days', now() - interval '7 days');

INSERT INTO partner_items (id, company_id, company_name, partner_id, item_type, item_name, unit, unit_cost, memo, is_active, created_at, updated_at)
VALUES
  ('stats-demo-partner-item-factory-a', 'company-sample-customer', '샘플 고객사', 'stats-demo-partner-factory-a', 'factory', '봉제', '벌', 3800, '통계 확인용 공장 항목', true, now() - interval '25 days', now() - interval '1 day'),
  ('stats-demo-partner-item-factory-b', 'company-sample-customer', '샘플 고객사', 'stats-demo-partner-factory-b', 'factory', '봉제', '벌', 4200, '통계 확인용 공장 항목', true, now() - interval '22 days', now() - interval '2 days'),
  ('stats-demo-partner-item-fabric-a', 'company-sample-customer', '샘플 고객사', 'stats-demo-partner-fabric-a', 'fabric', '30수 싱글', 'yard', 2800, '통계 확인용 원단 항목', true, now() - interval '20 days', now() - interval '3 days'),
  ('stats-demo-partner-item-fabric-b', 'company-sample-customer', '샘플 고객사', 'stats-demo-partner-fabric-b', 'fabric', '트윌', 'yard', 3400, '통계 확인용 원단 항목', true, now() - interval '18 days', now() - interval '4 days'),
  ('stats-demo-partner-item-subsidiary-a', 'company-sample-customer', '샘플 고객사', 'stats-demo-partner-subsidiary-a', 'subsidiary', '단추/라벨', '개', 120, '통계 확인용 부자재 항목', true, now() - interval '17 days', now() - interval '5 days'),
  ('stats-demo-partner-item-outsourcing-a', 'company-sample-customer', '샘플 고객사', 'stats-demo-partner-outsourcing-a', 'outsourcing', '나염', '공정', 1500, '통계 확인용 외주 항목', true, now() - interval '16 days', now() - interval '6 days'),
  ('stats-demo-partner-item-outsourcing-b', 'company-sample-customer', '샘플 고객사', 'stats-demo-partner-outsourcing-b', 'outsourcing', '자수', '공정', 1900, '통계 확인용 외주 항목', true, now() - interval '14 days', now() - interval '7 days');

INSERT INTO spec_sheets (
  id, company_id, company_name, title, status, work_order_kind, reorder_group_id, reorder_round, parent_spec_sheet_id,
  is_rework, category1_id, category2_id, category3_id, is_active, delete_status, purge_status, payload, created_at, updated_at, deleted_at
)
VALUES
  ('stats-demo-spec-001', 'company-sample-customer', '샘플 고객사', '데모 반팔 티셔츠 1차', 'draft', 'production', 'stats-demo-group-tee', 1, NULL, false, 'category:상의', 'category:상의:티셔츠', 'category:상의:티셔츠:반팔', true, 'active', 'none', '{"categoryLabel":"반팔 티셔츠","category":"상의 > 티셔츠 > 반팔"}'::jsonb, current_timestamp - interval '25 days', current_timestamp - interval '2 days', NULL),
  ('stats-demo-spec-002', 'company-sample-customer', '샘플 고객사', '데모 반팔 티셔츠 2차 리오더', 'review_requested', 'production', 'stats-demo-group-tee', 2, 'stats-demo-spec-001', true, 'category:상의', 'category:상의:티셔츠', 'category:상의:티셔츠:반팔', true, 'active', 'none', '{"categoryLabel":"반팔 티셔츠","category":"상의 > 티셔츠 > 반팔"}'::jsonb, current_timestamp - interval '18 days', current_timestamp - interval '1 days', NULL),
  ('stats-demo-spec-003', 'company-sample-customer', '샘플 고객사', '데모 슬랙스 샘플', 'review_completed', 'production', 'stats-demo-group-pants', 1, NULL, false, 'category:하의', 'category:하의:팬츠', 'category:하의:팬츠:슬랙스', true, 'active', 'none', '{"categoryLabel":"슬랙스","category":"하의 > 팬츠 > 슬랙스"}'::jsonb, current_timestamp - interval '15 days', current_timestamp - interval '3 days', NULL),
  ('stats-demo-spec-004', 'company-sample-customer', '샘플 고객사', '데모 테일러드 자켓', 'inspection', 'production', 'stats-demo-group-jacket', 1, NULL, false, 'category:아우터', 'category:아우터:자켓', 'category:아우터:자켓:테일러드', true, 'active', 'none', '{"categoryLabel":"테일러드 자켓","category":"아우터 > 자켓 > 테일러드"}'::jsonb, current_timestamp - interval '12 days', current_timestamp - interval '2 days', NULL),
  ('stats-demo-spec-005', 'company-sample-customer', '샘플 고객사', '데모 반팔 티셔츠 3차 리오더', 'completed', 'production', 'stats-demo-group-tee', 3, 'stats-demo-spec-002', true, 'category:상의', 'category:상의:티셔츠', 'category:상의:티셔츠:반팔', true, 'active', 'none', '{"categoryLabel":"반팔 티셔츠","category":"상의 > 티셔츠 > 반팔"}'::jsonb, current_timestamp - interval '9 days', current_timestamp - interval '1 days', NULL),
  ('stats-demo-spec-006', 'company-sample-customer', '샘플 고객사', '데모 슬랙스 리오더', 'completed', 'production', 'stats-demo-group-pants', 2, 'stats-demo-spec-003', true, 'category:하의', 'category:하의:팬츠', 'category:하의:팬츠:슬랙스', true, 'active', 'none', '{"categoryLabel":"슬랙스","category":"하의 > 팬츠 > 슬랙스"}'::jsonb, current_timestamp - interval '7 days', current_timestamp - interval '1 days', NULL),
  ('stats-demo-spec-007', 'company-sample-customer', '샘플 고객사', '데모 자켓 리오더', 'inspection', 'production', 'stats-demo-group-jacket', 2, 'stats-demo-spec-004', true, 'category:아우터', 'category:아우터:자켓', 'category:아우터:자켓:테일러드', true, 'active', 'none', '{"categoryLabel":"테일러드 자켓","category":"아우터 > 자켓 > 테일러드"}'::jsonb, current_timestamp - interval '5 days', current_timestamp - interval '2 days', NULL),
  ('stats-demo-spec-008', 'company-sample-customer', '샘플 고객사', '데모 반팔 티셔츠 검토 반려', 'rejected', 'production', 'stats-demo-group-tee-reject', 1, NULL, false, 'category:상의', 'category:상의:티셔츠', 'category:상의:티셔츠:반팔', true, 'active', 'none', '{"categoryLabel":"반팔 티셔츠","category":"상의 > 티셔츠 > 반팔"}'::jsonb, current_timestamp - interval '4 days', current_timestamp - interval '1 days', NULL),
  ('stats-demo-spec-009', 'company-sample-customer', '샘플 고객사', '데모 슬랙스 신규', 'draft', 'production', 'stats-demo-group-pants-new', 1, NULL, false, 'category:하의', 'category:하의:팬츠', 'category:하의:팬츠:슬랙스', true, 'active', 'none', '{"categoryLabel":"슬랙스","category":"하의 > 팬츠 > 슬랙스"}'::jsonb, current_timestamp - interval '2 days', current_timestamp - interval '12 hours', NULL),
  ('stats-demo-spec-010', 'company-sample-customer', '샘플 고객사', '데모 삭제 보관 작업', 'draft', 'production', 'stats-demo-group-trash', 1, NULL, false, 'category:상의', 'category:상의:티셔츠', 'category:상의:티셔츠:반팔', false, 'trashed', 'pending', '{"categoryLabel":"반팔 티셔츠","category":"상의 > 티셔츠 > 반팔"}'::jsonb, current_timestamp - interval '20 days', current_timestamp - interval '10 days', current_timestamp - interval '10 days');

INSERT INTO orders (id, company_id, company_name, spec_sheet_id, source_order_entry_id, factory_partner_id, factory_name, quantity, due_date, labor_cost, loss_cost, status, is_active, created_at, updated_at)
VALUES
  ('stats-demo-order-001', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-001', 'demo-entry-001', 'stats-demo-partner-factory-a', '데모 봉제공장 A', 120, to_char(current_date + interval '5 days', 'YYYY-MM-DD'), 456000, 24000, 'draft', true, now() - interval '25 days', now() - interval '2 days'),
  ('stats-demo-order-002', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-002', 'demo-entry-002', 'stats-demo-partner-factory-a', '데모 봉제공장 A', 180, to_char(current_date + interval '7 days', 'YYYY-MM-DD'), 684000, 36000, 'review_requested', true, now() - interval '18 days', now() - interval '1 days'),
  ('stats-demo-order-003', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-003', 'demo-entry-003', 'stats-demo-partner-factory-b', '데모 봉제공장 B', 80, to_char(current_date + interval '10 days', 'YYYY-MM-DD'), 336000, 16000, 'review_completed', true, now() - interval '15 days', now() - interval '3 days'),
  ('stats-demo-order-004', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-004', 'demo-entry-004', 'stats-demo-partner-factory-b', '데모 봉제공장 B', 60, to_char(current_date + interval '12 days', 'YYYY-MM-DD'), 420000, 30000, 'inspection', true, now() - interval '12 days', now() - interval '2 days'),
  ('stats-demo-order-005', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-005', 'demo-entry-005', 'stats-demo-partner-factory-a', '데모 봉제공장 A', 240, to_char(current_date - interval '2 days', 'YYYY-MM-DD'), 912000, 48000, 'completed', true, now() - interval '9 days', now() - interval '1 days'),
  ('stats-demo-order-006', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-006', 'demo-entry-006', 'stats-demo-partner-factory-b', '데모 봉제공장 B', 90, to_char(current_date - interval '1 days', 'YYYY-MM-DD'), 378000, 18000, 'completed', true, now() - interval '7 days', now() - interval '1 days'),
  ('stats-demo-order-007', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-007', 'demo-entry-007', 'stats-demo-partner-factory-b', '데모 봉제공장 B', 75, to_char(current_date + interval '6 days', 'YYYY-MM-DD'), 315000, 15000, 'inspection', true, now() - interval '5 days', now() - interval '2 days');

INSERT INTO attachments (id, company_id, company_name, order_id, type, storage_key, original_name, mime_type, size_bytes, author_id, is_primary, thumbnail_key, is_active, deleted_at, deleted_by, purge_after_at, created_at, updated_at)
VALUES
  ('stats-demo-attachment-001', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-001', 'design', 'workorders/stats-demo-spec-001/design/stats-demo-attachment-001.png', '반팔_디자인.png', 'image/png', 734003, 'user-sample-designer', true, 'workorders/stats-demo-spec-001/design/stats-demo-attachment-001-thumb.png', true, NULL, NULL, NULL, now() - interval '25 days', now() - interval '2 days'),
  ('stats-demo-attachment-002', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-002', 'file', 'workorders/stats-demo-spec-002/attachments/stats-demo-attachment-002.pdf', '작업지시서_참고.pdf', 'application/pdf', 1258291, 'user-sample-admin', false, NULL, true, NULL, NULL, NULL, now() - interval '18 days', now() - interval '1 days'),
  ('stats-demo-attachment-003', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-003', 'design', 'workorders/stats-demo-spec-003/design/stats-demo-attachment-003.jpg', '슬랙스_스케치.jpg', 'image/jpeg', 943718, 'user-sample-designer', true, 'workorders/stats-demo-spec-003/design/stats-demo-attachment-003-thumb.jpg', true, NULL, NULL, NULL, now() - interval '15 days', now() - interval '3 days'),
  ('stats-demo-attachment-004', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-004', 'file', 'workorders/stats-demo-spec-004/attachments/stats-demo-attachment-004.xlsx', '자켓_사이즈표.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 524288, 'user-sample-admin', false, NULL, true, NULL, NULL, NULL, now() - interval '12 days', now() - interval '2 days'),
  ('stats-demo-attachment-005', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-005', 'design', 'workorders/stats-demo-spec-005/design/stats-demo-attachment-005.png', '리오더_수정디자인.png', 'image/png', 838860, 'user-sample-designer', true, 'workorders/stats-demo-spec-005/design/stats-demo-attachment-005-thumb.png', true, NULL, NULL, NULL, now() - interval '9 days', now() - interval '1 days'),
  ('stats-demo-attachment-006', 'company-sample-customer', '샘플 고객사', 'stats-demo-spec-010', 'file', 'workorders/stats-demo-spec-010/attachments/stats-demo-attachment-006.pdf', '삭제된_참고자료.pdf', 'application/pdf', 629145, 'user-sample-admin', false, NULL, false, now() - interval '10 days', 'user-sample-admin', now() + interval '20 days', now() - interval '20 days', now() - interval '10 days');

INSERT INTO attachment_trash_items (id, company_id, company_name, attachment_id, order_id, storage_key, thumbnail_key, original_name, mime_type, size_bytes, deleted_by, deleted_at, purge_after_at, purge_status, created_at, updated_at)
VALUES
  ('stats-demo-trash-001', 'company-sample-customer', '샘플 고객사', 'stats-demo-attachment-006', 'stats-demo-spec-010', 'workorders/stats-demo-spec-010/attachments/stats-demo-attachment-006.pdf', NULL, '삭제된_참고자료.pdf', 'application/pdf', 629145, 'user-sample-admin', now() - interval '10 days', now() + interval '20 days', 'pending', now() - interval '10 days', now() - interval '10 days');

INSERT INTO company_workorder_daily_stats (company_id, stats_date, created_workorder_count, active_workorder_count, completed_workorder_count, trashed_workorder_count, reorder_workorder_count, order_count, order_quantity_total, labor_cost_total, loss_cost_total, memo_count, attachment_count)
VALUES
  ('company-sample-customer', current_date - interval '7 days', 1, 7, 1, 1, 3, 1, 90, 378000, 18000, 0, 1),
  ('company-sample-customer', current_date - interval '5 days', 1, 8, 0, 1, 4, 1, 75, 315000, 15000, 0, 0),
  ('company-sample-customer', current_date - interval '2 days', 1, 9, 0, 1, 4, 1, 60, 420000, 30000, 0, 1),
  ('company-sample-customer', current_date - interval '1 days', 2, 9, 2, 1, 4, 2, 420, 1290000, 66000, 0, 2);

INSERT INTO company_workorder_monthly_stats (company_id, stats_month, created_workorder_count, active_workorder_count, completed_workorder_count, trashed_workorder_count, reorder_workorder_count, order_count, order_quantity_total, labor_cost_total, loss_cost_total, memo_count, attachment_count)
VALUES
  ('company-sample-customer', date_trunc('month', current_date)::date, 9, 9, 2, 1, 4, 7, 845, 3501000, 187000, 0, 6)
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
VALUES
  ('company-sample-customer', current_date, 5, 4299160, 1, 629145, 0, 0, 0, 0, 3, 6, 4928305)
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
  'stats demo seed 0.9.2071 applied' AS result,
  (SELECT COUNT(*) FROM spec_sheets WHERE id LIKE 'stats-demo-%') AS spec_sheet_count,
  (SELECT COUNT(*) FROM orders WHERE id LIKE 'stats-demo-%') AS order_count,
  (SELECT COUNT(*) FROM attachments WHERE id LIKE 'stats-demo-%') AS attachment_count,
  (SELECT COUNT(*) FROM partners WHERE id LIKE 'stats-demo-%') AS partner_count;
