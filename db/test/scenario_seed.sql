-- WAFL / PeaceByPiece test scenario seed
-- Version: 0.16.45
-- Purpose:
--   Create deterministic test companies, users, members, permissions, categories,
--   partners, partner capabilities, materials, and workorders for manual DB verification.
--
-- Usage:
--   1) Apply db/schema/full_reset.sql first when using a fresh local DB.
--   2) Run this file only in a development/test database.
--   3) Do not run this file against production data.
--
-- Notes:
--   - This seed does not bypass Google login.
--   - Emails below are fake and intended for DB verification only.
--   - Browser login tests need the Google-linked seed planned for 0.16.38.

BEGIN;

-- Remove previous deterministic test data.
DELETE FROM audit_logs
WHERE company_id IN ('test-company-a', 'test-company-b')
   OR target_id LIKE 'test-%'
   OR actor_user_id LIKE 'test-%';

DELETE FROM history_logs
WHERE company_id IN ('test-company-a', 'test-company-b')
   OR target_id LIKE 'test-%'
   OR user_id LIKE 'test-%';

DELETE FROM companies
WHERE id IN ('test-company-a', 'test-company-b');

-- Ensure the permission keys used by the test members exist.
INSERT INTO permission_catalog (
  permission_key,
  label,
  description,
  category,
  permission_group,
  sort_order,
  is_active
)
VALUES
  ('workorder.read', '작업지시서 조회', '테스트 seed용 작업지시서 조회 권한', 'workorder', 'workorder', 10, true),
  ('workorder.create', '작업지시서 생성', '테스트 seed용 작업지시서 생성 권한', 'workorder', 'workorder', 20, true),
  ('workorder.update', '작업지시서 수정', '테스트 seed용 작업지시서 수정 권한', 'workorder', 'workorder', 30, true),
  ('workorder.delete', '작업지시서 삭제', '테스트 seed용 작업지시서 삭제 권한', 'workorder', 'workorder', 40, true),
  ('workorder.status.review', '검토 상태 변경', '테스트 seed용 검토요청 권한', 'workflow', 'workflow', 60, true),
  ('workorder.status.order', '작업지시서 발주 상태 변경', '테스트 seed용 발주요청 권한', 'workflow', 'workflow', 70, true),
  ('workorder.status.inspect', '검수 상태 변경', '테스트 seed용 제품 검수 권한', 'workflow', 'workflow', 80, true),
  ('material.order.request', '원단·부자재 주문 요청', '테스트 seed용 자재 주문 요청 권한', 'material', 'material', 100, true),
  ('material.order.place', '원단·부자재 발주 처리', '테스트 seed용 자재 발주 처리 권한', 'material', 'material', 105, true),
  ('partner.read', '협력업체 조회', '테스트 seed용 협력업체 조회 권한', 'partner', 'partner', 110, true),
  ('partner.create', '협력업체 등록', '테스트 seed용 협력업체 등록 권한', 'partner', 'partner', 120, true),
  ('partner.update', '협력업체 수정', '테스트 seed용 협력업체 수정 권한', 'partner', 'partner', 130, true),
  ('partner.delete', '협력업체 비활성/삭제', '테스트 seed용 협력업체 삭제 권한', 'partner', 'partner', 140, true),
  ('standards.read', '기준정보 조회', '테스트 seed용 기준정보 조회 권한', 'standards', 'standards', 190, true),
  ('standards.create', '기준정보 등록', '테스트 seed용 기준정보 등록 권한', 'standards', 'standards', 200, true),
  ('standards.update', '기준정보 수정', '테스트 seed용 기준정보 수정 권한', 'standards', 'standards', 210, true),
  ('standards.delete', '기준정보 삭제/비활성', '테스트 seed용 기준정보 삭제 권한', 'standards', 'standards', 220, true)
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  permission_group = EXCLUDED.permission_group,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Companies.
INSERT INTO companies (
  id,
  name,
  english_name,
  business_name,
  business_registration_number,
  postal_code,
  road_address,
  jibun_address,
  address_detail,
  address_extra,
  requested_plan_code,
  onboarding_status,
  onboarding_completed_at,
  subscription_status,
  billing_status,
  trial_started_at,
  trial_ends_at,
  storage_limit_bytes,
  member_limit,
  is_active
)
VALUES
  (
    'test-company-a',
    'TEST A 고객사',
    'TEST A CUSTOMER',
    'TEST A 사업자',
    '000-00-00001',
    '58328',
    '전라남도 나주시 그린로 1',
    '전라남도 나주시 빛가람동 000',
    '205동 2202호',
    '테스트 주소',
    'basic',
    'active',
    now(),
    'trialing',
    'trial',
    now(),
    now() + interval '7 days',
    104857600,
    10,
    true
  ),
  (
    'test-company-b',
    'TEST B 고객사',
    'TEST B CUSTOMER',
    'TEST B 사업자',
    '000-00-00002',
    '58328',
    '전라남도 나주시 그린로 2',
    '전라남도 나주시 빛가람동 001',
    '101동 101호',
    '테스트 주소',
    'basic',
    'active',
    now(),
    'trialing',
    'trial',
    now(),
    now() + interval '7 days',
    104857600,
    10,
    true
  );

-- Users.
INSERT INTO users (
  id,
  company_id,
  email,
  name,
  phone,
  phone_source,
  role,
  is_active
)
VALUES
  ('test-a-admin', 'test-company-a', 'test-a-admin@example.invalid', 'TEST A 관리자', '01000000001', 'user', 'admin', true),
  ('test-a-designer', 'test-company-a', 'test-a-designer@example.invalid', 'TEST A 디자이너', '01000000002', 'user', 'designer', true),
  ('test-a-inspector', 'test-company-a', 'test-a-inspector@example.invalid', 'TEST A 검수담당', '01000000003', 'user', 'inspector', true),
  ('test-a-material', 'test-company-a', 'test-a-material@example.invalid', 'TEST A 자재담당', '01000000004', 'user', 'inventory_manager', true),
  ('test-a-viewer', 'test-company-a', 'test-a-viewer@example.invalid', 'TEST A 조회전용', '01000000005', 'user', 'viewer', true),
  ('test-b-admin', 'test-company-b', 'test-b-admin@example.invalid', 'TEST B 관리자', '01000000006', 'user', 'admin', true),
  ('test-b-designer', 'test-company-b', 'test-b-designer@example.invalid', 'TEST B 디자이너', '01000000007', 'user', 'designer', true);

UPDATE companies
SET owner_user_id = CASE id
  WHEN 'test-company-a' THEN 'test-a-admin'
  WHEN 'test-company-b' THEN 'test-b-admin'
  ELSE owner_user_id
END
WHERE id IN ('test-company-a', 'test-company-b');

-- Legacy company_users bridge.
INSERT INTO company_users (
  id,
  company_id,
  user_id,
  role,
  is_active,
  display_name,
  joined_at
)
VALUES
  ('test-cu-a-admin', 'test-company-a', 'test-a-admin', 'admin', true, 'TEST A 관리자', now()),
  ('test-cu-a-designer', 'test-company-a', 'test-a-designer', 'designer', true, 'TEST A 디자이너', now()),
  ('test-cu-a-inspector', 'test-company-a', 'test-a-inspector', 'inspector', true, 'TEST A 검수담당', now()),
  ('test-cu-a-material', 'test-company-a', 'test-a-material', 'inventory_manager', true, 'TEST A 자재담당', now()),
  ('test-cu-a-viewer', 'test-company-a', 'test-a-viewer', 'viewer', true, 'TEST A 조회전용', now()),
  ('test-cu-b-admin', 'test-company-b', 'test-b-admin', 'admin', true, 'TEST B 관리자', now()),
  ('test-cu-b-designer', 'test-company-b', 'test-b-designer', 'designer', true, 'TEST B 디자이너', now());

-- Current member model.
INSERT INTO company_members (
  id,
  company_id,
  user_id,
  status,
  role_template_code,
  display_name,
  approved_by,
  approved_at
)
VALUES
  ('test-cm-a-admin', 'test-company-a', 'test-a-admin', 'approved', 'company_admin', 'TEST A 관리자', 'test-a-admin', now()),
  ('test-cm-a-designer', 'test-company-a', 'test-a-designer', 'approved', 'designer', 'TEST A 디자이너', 'test-a-admin', now()),
  ('test-cm-a-inspector', 'test-company-a', 'test-a-inspector', 'approved', 'inspector', 'TEST A 검수담당', 'test-a-admin', now()),
  ('test-cm-a-material', 'test-company-a', 'test-a-material', 'approved', 'inventory_manager', 'TEST A 자재담당', 'test-a-admin', now()),
  ('test-cm-a-viewer', 'test-company-a', 'test-a-viewer', 'approved', 'viewer', 'TEST A 조회전용', 'test-a-admin', now()),
  ('test-cm-b-admin', 'test-company-b', 'test-b-admin', 'approved', 'company_admin', 'TEST B 관리자', 'test-b-admin', now()),
  ('test-cm-b-designer', 'test-company-b', 'test-b-designer', 'approved', 'designer', 'TEST B 디자이너', 'test-b-admin', now());

-- Role templates for permission default tests.
INSERT INTO role_templates (
  id,
  company_id,
  role_code,
  role_name,
  description,
  is_system_default,
  sort_order,
  is_active
)
VALUES
  ('test-rt-a-designer', 'test-company-a', 'designer', '디자이너', 'TEST A 디자이너 기본 권한', true, 10, true),
  ('test-rt-a-inspector', 'test-company-a', 'inspector', '검수 담당', 'TEST A 검수 담당 기본 권한', true, 20, true),
  ('test-rt-a-material', 'test-company-a', 'inventory_manager', '재고·자재 담당', 'TEST A 자재 담당 기본 권한', true, 30, true),
  ('test-rt-a-viewer', 'test-company-a', 'viewer', '조회 전용', 'TEST A 조회 전용 기본 권한', true, 40, false);

INSERT INTO role_template_permissions (role_template_id, permission_code, is_enabled)
VALUES
  ('test-rt-a-designer', 'workorder.read', true),
  ('test-rt-a-designer', 'workorder.create', true),
  ('test-rt-a-designer', 'workorder.update', true),
  ('test-rt-a-designer', 'workorder.status.review', true),
  ('test-rt-a-designer', 'workorder.status.order', true),

  ('test-rt-a-inspector', 'workorder.read', true),
  ('test-rt-a-inspector', 'workorder.status.inspect', true),

  ('test-rt-a-material', 'workorder.read', true),
  ('test-rt-a-material', 'material.order.request', true),
  ('test-rt-a-material', 'material.order.place', true),

  ('test-rt-a-viewer', 'workorder.read', true);

-- Member-specific permissions.
INSERT INTO member_permissions (company_member_id, permission_code, is_enabled, granted_by)
VALUES
  ('test-cm-a-admin', 'workorder.read', true, 'test-a-admin'),
  ('test-cm-a-admin', 'workorder.create', true, 'test-a-admin'),
  ('test-cm-a-admin', 'workorder.update', true, 'test-a-admin'),
  ('test-cm-a-admin', 'workorder.delete', true, 'test-a-admin'),
  ('test-cm-a-admin', 'workorder.status.review', true, 'test-a-admin'),
  ('test-cm-a-admin', 'workorder.status.order', true, 'test-a-admin'),
  ('test-cm-a-admin', 'workorder.status.inspect', true, 'test-a-admin'),
  ('test-cm-a-admin', 'material.order.request', true, 'test-a-admin'),
  ('test-cm-a-admin', 'material.order.place', true, 'test-a-admin'),
  ('test-cm-a-admin', 'partner.read', true, 'test-a-admin'),
  ('test-cm-a-admin', 'partner.create', true, 'test-a-admin'),
  ('test-cm-a-admin', 'partner.update', true, 'test-a-admin'),
  ('test-cm-a-admin', 'partner.delete', true, 'test-a-admin'),
  ('test-cm-a-admin', 'standards.read', true, 'test-a-admin'),
  ('test-cm-a-admin', 'standards.create', true, 'test-a-admin'),
  ('test-cm-a-admin', 'standards.update', true, 'test-a-admin'),
  ('test-cm-a-admin', 'standards.delete', true, 'test-a-admin'),

  ('test-cm-a-designer', 'workorder.read', true, 'test-a-admin'),
  ('test-cm-a-designer', 'workorder.create', true, 'test-a-admin'),
  ('test-cm-a-designer', 'workorder.update', true, 'test-a-admin'),
  ('test-cm-a-designer', 'workorder.status.review', true, 'test-a-admin'),
  ('test-cm-a-designer', 'workorder.status.order', true, 'test-a-admin'),

  ('test-cm-a-inspector', 'workorder.read', true, 'test-a-admin'),
  ('test-cm-a-inspector', 'workorder.status.inspect', true, 'test-a-admin'),

  ('test-cm-a-material', 'workorder.read', true, 'test-a-admin'),
  ('test-cm-a-material', 'material.order.request', true, 'test-a-admin'),
  ('test-cm-a-material', 'material.order.place', true, 'test-a-admin'),

  ('test-cm-a-viewer', 'workorder.read', true, 'test-a-admin'),

  ('test-cm-b-admin', 'workorder.read', true, 'test-b-admin'),
  ('test-cm-b-admin', 'workorder.create', true, 'test-b-admin'),
  ('test-cm-b-admin', 'workorder.update', true, 'test-b-admin'),

  ('test-cm-b-designer', 'workorder.read', true, 'test-b-admin'),
  ('test-cm-b-designer', 'workorder.create', true, 'test-b-admin'),
  ('test-cm-b-designer', 'workorder.update', true, 'test-b-admin');

-- Category path fixtures.
INSERT INTO item_categories (id, company_id, parent_id, level, name, sort_order)
VALUES
  ('test-a-cat-outer', 'test-company-a', NULL, 1, '상의', 10),
  ('test-a-cat-tshirt', 'test-company-a', 'test-a-cat-outer', 2, '티셔츠', 10),
  ('test-a-cat-short', 'test-company-a', 'test-a-cat-tshirt', 3, '반팔', 10),
  ('test-b-cat-outer', 'test-company-b', NULL, 1, '상의', 10),
  ('test-b-cat-shirt', 'test-company-b', 'test-b-cat-outer', 2, '셔츠', 10);

-- Partners and materials.
INSERT INTO partners (
  id,
  company_id,
  company_name,
  name,
  contact_person,
  contact,
  email,
  is_active
)
VALUES
  ('test-a-partner-factory', 'test-company-a', 'TEST A 고객사', 'TEST A 봉제공장', '공장담당자', '010-0000-0001', 'factory-a@example.invalid', true),
  ('test-a-partner-material', 'test-company-a', 'TEST A 고객사', 'TEST A 원단처', '원단담당자', '010-0000-0002', 'material-a@example.invalid', true),
  ('test-b-partner-factory', 'test-company-b', 'TEST B 고객사', 'TEST B 봉제공장', '공장담당자', '010-0000-0003', 'factory-b@example.invalid', true);

INSERT INTO partner_items (
  id,
  company_id,
  company_name,
  partner_id,
  item_type,
  item_name,
  unit,
  unit_cost,
  memo,
  is_active
)
VALUES
  ('test-a-partner-item-factory-main', 'test-company-a', 'TEST A 고객사', 'test-a-partner-factory', 'factory', '봉제 공임', 'ea', 150000, '발주요청 공장 선택 검증용', true),
  ('test-a-partner-item-material-main', 'test-company-a', 'TEST A 고객사', 'test-a-partner-material', 'fabric', '원단 공급', 'yd', 4500, '원단 거래처 선택 검증용', true),
  ('test-b-partner-item-factory-main', 'test-company-b', 'TEST B 고객사', 'test-b-partner-factory', 'factory', '봉제 공임', 'ea', 80000, '회사 B 공장 범위 검증용', true);

INSERT INTO materials (
  id,
  company_id,
  kind,
  code,
  name,
  category_id,
  partner_id,
  unit,
  lifecycle_status,
  memo
)
VALUES
  ('test-a-material-fabric-01', 'test-company-a', 'fabric', 'TEST-A-FAB-001', 'TEST A 코튼 싱글', 'test-a-cat-short', 'test-a-partner-material', 'yd', 'active', '작업지시서 자재 요구량 테스트용'),
  ('test-a-material-trim-01', 'test-company-a', 'submaterial', 'TEST-A-TRIM-001', 'TEST A 라벨', 'test-a-cat-short', 'test-a-partner-material', 'ea', 'active', '작업지시서 부자재 요구량 테스트용'),
  ('test-b-material-fabric-01', 'test-company-b', 'fabric', 'TEST-B-FAB-001', 'TEST B 셔츠 원단', 'test-b-cat-shirt', 'test-b-partner-factory', 'yd', 'active', '회사 범위 테스트용');

-- Workorder fixtures.
INSERT INTO spec_sheets (
  id,
  company_id,
  company_name,
  title,
  status,
  work_order_kind,
  category1_id,
  category2_id,
  category3_id,
  category1,
  category2,
  category3,
  display_title,
  base_title,
  season,
  priority,
  manager,
  manager_id,
  created_by_id,
  created_by_role,
  due_date,
  quantity,
  memo,
  is_active,
  delete_status
)
VALUES
  ('test-a-wo-draft-designer', 'test-company-a', 'TEST A 고객사', 'TEST A 작성중 디자이너 담당', 'draft', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 작성중 디자이너 담당', 'TEST A 작성중 디자이너 담당', '2026 SS', 'normal', 'TEST A 디자이너', 'test-a-designer', 'test-a-designer', 'designer', '2026-06-10', 100, '디자이너 생성/수정 테스트', true, 'active'),
  ('test-a-wo-review-requested', 'test-company-a', 'TEST A 고객사', 'TEST A 검토요청 디자이너 담당', 'review_requested', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 검토요청 디자이너 담당', 'TEST A 검토요청 디자이너 담당', '2026 SS', 'normal', 'TEST A 디자이너', 'test-a-designer', 'test-a-designer', 'designer', '2026-06-12', 120, 'review_requested 상태에서는 일반 멤버 발주요청 버튼 숨김 기대', true, 'active'),
  ('test-a-wo-review-completed', 'test-company-a', 'TEST A 고객사', 'TEST A 검토완료 디자이너 담당', 'review_completed', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 검토완료 디자이너 담당', 'TEST A 검토완료 디자이너 담당', '2026 SS', 'high', 'TEST A 디자이너', 'test-a-designer', 'test-a-admin', 'admin', '2026-06-15', 150, '검토완료 후 발주요청 테스트', true, 'active'),
  ('test-a-wo-inspection', 'test-company-a', 'TEST A 고객사', 'TEST A 검수중 검수담당 담당', 'inspection', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 검수중 검수담당 담당', 'TEST A 검수중 검수담당 담당', '2026 SS', 'normal', 'TEST A 검수담당', 'test-a-inspector', 'test-a-admin', 'admin', '2026-06-18', 80, '검수 가능 권한 테스트', true, 'active'),
  ('test-a-wo-completed', 'test-company-a', 'TEST A 고객사', 'TEST A 완료 검수담당 담당', 'completed', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 완료 검수담당 담당', 'TEST A 완료 검수담당 담당', '2026 SS', 'low', 'TEST A 검수담당', 'test-a-inspector', 'test-a-admin', 'admin', '2026-06-20', 90, '완료 필터 테스트', true, 'active'),
  ('test-a-wo-rejected', 'test-company-a', 'TEST A 고객사', 'TEST A 반려 디자이너 담당', 'rejected', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 반려 디자이너 담당', 'TEST A 반려 디자이너 담당', '2026 SS', 'normal', 'TEST A 디자이너', 'test-a-designer', 'test-a-admin', 'admin', '2026-06-21', 70, '반려 상태 테스트', true, 'active'),
  ('test-a-wo-material-draft', 'test-company-a', 'TEST A 고객사', 'TEST A 작성중 자재담당 담당', 'draft', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 작성중 자재담당 담당', 'TEST A 작성중 자재담당 담당', '2026 SS', 'normal', 'TEST A 자재담당', 'test-a-material', 'test-a-material', 'inventory_manager', '2026-06-22', 110, '자재 담당 목록 테스트', true, 'active'),
  ('test-a-wo-trashed', 'test-company-a', 'TEST A 고객사', 'TEST A 휴지통 작업지시서', 'draft', 'new', 'test-a-cat-outer', 'test-a-cat-tshirt', 'test-a-cat-short', '상의', '티셔츠', '반팔', 'TEST A 휴지통 작업지시서', 'TEST A 휴지통 작업지시서', '2026 SS', 'normal', 'TEST A 디자이너', 'test-a-designer', 'test-a-designer', 'designer', '2026-06-25', 50, '일반 목록 제외 테스트', false, 'trashed'),
  ('test-b-wo-draft-designer', 'test-company-b', 'TEST B 고객사', 'TEST B 작성중 디자이너 담당', 'draft', 'new', 'test-b-cat-outer', 'test-b-cat-shirt', NULL, '상의', '셔츠', NULL, 'TEST B 작성중 디자이너 담당', 'TEST B 작성중 디자이너 담당', '2026 SS', 'normal', 'TEST B 디자이너', 'test-b-designer', 'test-b-designer', 'designer', '2026-06-10', 60, '회사 범위 차단 테스트', true, 'active');

INSERT INTO orders (
  id,
  company_id,
  spec_sheet_id,
  factory_partner_id,
  factory_name,
  quantity,
  due_date,
  labor_cost,
  loss_cost,
  status
)
VALUES
  ('test-a-order-draft-designer', 'test-company-a', 'test-a-wo-draft-designer', 'test-a-partner-factory', 'TEST A 봉제공장', 100, '2026-06-10', 120000, 5000, 'draft'),
  ('test-a-order-review-requested', 'test-company-a', 'test-a-wo-review-requested', 'test-a-partner-factory', 'TEST A 봉제공장', 120, '2026-06-12', 130000, 5000, 'draft'),
  ('test-a-order-review-completed', 'test-company-a', 'test-a-wo-review-completed', 'test-a-partner-factory', 'TEST A 봉제공장', 150, '2026-06-15', 150000, 7000, 'order_pending'),
  ('test-a-order-inspection', 'test-company-a', 'test-a-wo-inspection', 'test-a-partner-factory', 'TEST A 봉제공장', 80, '2026-06-18', 90000, 4000, 'inspection_in_progress'),
  ('test-a-order-completed', 'test-company-a', 'test-a-wo-completed', 'test-a-partner-factory', 'TEST A 봉제공장', 90, '2026-06-20', 100000, 4000, 'inspection_completed'),
  ('test-b-order-draft-designer', 'test-company-b', 'test-b-wo-draft-designer', 'test-b-partner-factory', 'TEST B 봉제공장', 60, '2026-06-10', 80000, 3000, 'draft');

INSERT INTO workorder_material_lines (
  id,
  company_id,
  workorder_id,
  material_id,
  role,
  required_quantity,
  unit,
  order_status,
  memo
)
VALUES
  ('test-a-wml-draft-main', 'test-company-a', 'test-a-wo-draft-designer', 'test-a-material-fabric-01', 'main_fabric', 30.000, 'yd', 'not_requested', '작성중 원단 필요량'),
  ('test-a-wml-review-main', 'test-company-a', 'test-a-wo-review-requested', 'test-a-material-fabric-01', 'main_fabric', 36.000, 'yd', 'request_pending', '검토요청 원단 필요량'),
  ('test-a-wml-material-main', 'test-company-a', 'test-a-wo-material-draft', 'test-a-material-fabric-01', 'main_fabric', 33.000, 'yd', 'not_requested', '자재담당 원단 필요량'),
  ('test-a-wml-material-trim', 'test-company-a', 'test-a-wo-material-draft', 'test-a-material-trim-01', 'label', 110.000, 'ea', 'not_requested', '자재담당 부자재 필요량');

INSERT INTO attachments (
  id,
  company_id,
  company_name,
  order_id,
  type,
  storage_key,
  original_name,
  mime_type,
  size_bytes,
  author_id,
  is_active,
  source_type
)
VALUES
  ('test-a-attachment-design', 'test-company-a', 'TEST A 고객사', 'test-a-wo-draft-designer', 'design', 'companies/test-company-a/workorders/test-a-wo-draft-designer/design/test-a-attachment-design.png', 'test-design.png', 'image/png', 102400, 'test-a-designer', true, 'user'),
  ('test-a-attachment-file', 'test-company-a', 'TEST A 고객사', 'test-a-wo-review-completed', 'file', 'companies/test-company-a/workorders/test-a-wo-review-completed/attachments/test-a-attachment-file.pdf', 'test-spec.pdf', 'application/pdf', 204800, 'test-a-admin', true, 'user');

INSERT INTO memos (
  id,
  company_id,
  company_name,
  order_id,
  body,
  author_id,
  is_active,
  delete_status
)
VALUES
  ('test-a-memo-draft', 'test-company-a', 'TEST A 고객사', 'test-a-wo-draft-designer', 'TEST A 작성중 메모', 'test-a-designer', true, 'active'),
  ('test-a-memo-inspection', 'test-company-a', 'TEST A 고객사', 'test-a-wo-inspection', 'TEST A 검수중 메모', 'test-a-inspector', true, 'active');

INSERT INTO history_logs (
  id,
  company_id,
  user_id,
  action_type,
  target_type,
  target_id,
  message,
  metadata
)
VALUES
  ('test-history-workorder-created', 'test-company-a', 'test-a-designer', 'WORKORDER_CREATED', 'workorder', 'test-a-wo-draft-designer', 'TEST A 작업지시서 생성', '{"seed":"0.16.37"}'::jsonb),
  ('test-history-status-changed', 'test-company-a', 'test-a-admin', 'STATUS_CHANGED', 'workorder', 'test-a-wo-review-requested', 'TEST A 검토요청 상태 변경', '{"seed":"0.16.37"}'::jsonb);

COMMIT;
