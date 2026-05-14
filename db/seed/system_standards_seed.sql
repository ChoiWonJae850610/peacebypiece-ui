-- =========================================
-- PeaceByPiece seed: system standards baseline
-- 시스템 기준정보 seed 보강
--
-- 목적:
-- - 0.10.46 이후 기준정보 화면은 fallback을 사용하지 않고 DB 결과만 표시한다.
-- - 기존 DB를 유지하면서 단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿 seed를 보강한다.
-- - full_reset 없이 기존 개발 DB에 부족한 시스템 기준정보만 채운다.
--
-- 주의:
-- - 이 SQL은 baseline seed를 upsert한다.
-- - 고객관리자가 미사용 처리한 company_enabled_* 기존 설정은 덮어쓰지 않는다.
-- - 신규로 누락된 고객사-기준정보 연결만 true 기본값으로 추가한다.
-- =========================================

BEGIN;

INSERT INTO system_permission_catalog (permission_key, label, description, category, is_active)
VALUES
  ('system.standard.manage', '시스템 기준정보 관리', '시스템관리자가 단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿을 관리할 수 있다.', 'standards', true)
ON CONFLICT (permission_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO system_user_permissions (system_user_id, permission_key, is_enabled)
SELECT su.id, 'system.standard.manage', true
FROM system_users su
WHERE su.role = 'system_admin'
ON CONFLICT (system_user_id, permission_key) DO NOTHING;

INSERT INTO system_unit_standards (id, code, korean_name, english_code, category, description, example_label, is_active, sort_order)
VALUES
  ('system-unit-piece', 'piece', '장', 'pcs', 'count', '일반 의류 수량 단위', '티셔츠 100장', true, 10),
  ('system-unit-each', 'each', '개', 'ea', 'count', '부자재 개수 단위', '단추 100개', true, 15),
  ('system-unit-set', 'set', '벌', 'set', 'count', '상하의 세트 또는 묶음 단위', '트레이닝 세트 50벌', true, 20),
  ('system-unit-meter', 'meter', '미터', 'm', 'length', '원단 길이 단위', '면 원단 30m', true, 30),
  ('system-unit-yard', 'yard', '야드', 'yd', 'length', '수입 원단 길이 단위', '수입 원단 20yd', true, 40),
  ('system-unit-roll', 'roll', '롤', 'roll', 'bundle', '롤 단위 원부자재', '심지 3롤', true, 50),
  ('system-unit-box', 'box', '박스', 'box', 'bundle', '박스 단위 부자재', '단추 2박스', true, 60),
  ('system-unit-process', 'process', '공정', 'process', 'service', '외주공정 단위', '자수 1공정', true, 70)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    korean_name = EXCLUDED.korean_name,
    english_code = EXCLUDED.english_code,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    example_label = EXCLUDED.example_label,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO company_enabled_unit_standards (company_id, unit_standard_id, is_enabled, sort_order)
SELECT c.id, sus.id, true, sus.sort_order
FROM companies c
CROSS JOIN system_unit_standards sus
ON CONFLICT (company_id, unit_standard_id) DO NOTHING;

INSERT INTO system_outsourcing_process_standards (id, code, name, category, description, example_label, is_active, sort_order)
VALUES
  ('system-process-printing', 'printing', '나염', 'surface', '원단 또는 완제품 위 프린트 공정', '앞판 나염', true, 10),
  ('system-process-embroidery', 'embroidery', '자수', 'surface', '로고·문양 자수 공정', '가슴 로고 자수', true, 20),
  ('system-process-washing', 'washing', '워싱', 'finishing', '수축·질감·후가공 워싱 공정', '바이오 워싱', true, 30),
  ('system-process-pleats', 'pleats', '플리츠', 'finishing', '주름 고정 외주 공정', '스커트 플리츠', true, 40),
  ('system-process-bonding', 'bonding', '본딩', 'construction', '원단 또는 부자재 접착 공정', '심지 본딩', true, 50)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    example_label = EXCLUDED.example_label,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO company_enabled_process_standards (company_id, process_standard_id, is_enabled, sort_order)
SELECT c.id, sps.id, true, sps.sort_order
FROM companies c
CROSS JOIN system_outsourcing_process_standards sps
ON CONFLICT (company_id, process_standard_id) DO NOTHING;

INSERT INTO system_product_type_templates (id, code, name, description, is_default, is_active, sort_order)
VALUES
  ('template-apparel-basic', 'apparel-basic', '의류 기본 템플릿', '신규 고객사 생성 시 복사할 1차-2차-3차 생산품 유형 기본값입니다.', true, true, 10)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_default = EXCLUDED.is_default,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO system_product_type_template_categories (id, template_id, parent_id, level, name, is_active, sort_order)
VALUES
  ('template-apparel-basic:상의', 'template-apparel-basic', NULL, 1, '상의', true, 10),
  ('template-apparel-basic:상의:티셔츠', 'template-apparel-basic', 'template-apparel-basic:상의', 2, '티셔츠', true, 10),
  ('template-apparel-basic:상의:티셔츠:반팔', 'template-apparel-basic', 'template-apparel-basic:상의:티셔츠', 3, '반팔', true, 10),
  ('template-apparel-basic:하의', 'template-apparel-basic', NULL, 1, '하의', true, 20),
  ('template-apparel-basic:하의:팬츠', 'template-apparel-basic', 'template-apparel-basic:하의', 2, '팬츠', true, 10),
  ('template-apparel-basic:하의:팬츠:슬랙스', 'template-apparel-basic', 'template-apparel-basic:하의:팬츠', 3, '슬랙스', true, 10),
  ('template-apparel-basic:아우터', 'template-apparel-basic', NULL, 1, '아우터', true, 30),
  ('template-apparel-basic:아우터:자켓', 'template-apparel-basic', 'template-apparel-basic:아우터', 2, '자켓', true, 10),
  ('template-apparel-basic:아우터:자켓:테일러드', 'template-apparel-basic', 'template-apparel-basic:아우터:자켓', 3, '테일러드', true, 10)
ON CONFLICT (id) DO UPDATE
SET template_id = EXCLUDED.template_id,
    parent_id = EXCLUDED.parent_id,
    level = EXCLUDED.level,
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

COMMIT;
