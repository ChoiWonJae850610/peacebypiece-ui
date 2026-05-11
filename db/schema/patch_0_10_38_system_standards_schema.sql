-- =========================================
-- PeaceByPiece patch 0.10.38
-- 시스템 기준정보 DB schema 설계
--
-- 목적:
-- - 단위 표준과 외주공정 유형은 시스템관리자 표준 원장으로 관리한다.
-- - 고객사는 시스템 표준 중 사용/미사용만 선택한다.
-- - 생산품 유형은 고객사별 직접 관리를 유지하되, 신규 고객사 기본 템플릿 원장을 시스템에 둔다.
-- =========================================

BEGIN;

CREATE TABLE IF NOT EXISTS system_unit_standards (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  korean_name text NOT NULL,
  english_code text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  example_label text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_enabled_unit_standards (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_standard_id text NOT NULL REFERENCES system_unit_standards(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  custom_label text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, unit_standard_id)
);

CREATE TABLE IF NOT EXISTS system_outsourcing_process_standards (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  example_label text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_enabled_process_standards (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  process_standard_id text NOT NULL REFERENCES system_outsourcing_process_standards(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  custom_label text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, process_standard_id)
);

CREATE TABLE IF NOT EXISTS system_product_type_templates (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_product_type_template_categories (
  id text PRIMARY KEY,
  template_id text NOT NULL REFERENCES system_product_type_templates(id) ON DELETE CASCADE,
  parent_id text REFERENCES system_product_type_template_categories(id) ON DELETE CASCADE,
  level integer NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_product_type_template_categories_level_check CHECK (level IN (1, 2, 3)),
  CONSTRAINT system_product_type_template_categories_unique UNIQUE (template_id, parent_id, name)
);

CREATE INDEX IF NOT EXISTS system_unit_standards_active_idx
  ON system_unit_standards (is_active, sort_order, korean_name);
CREATE INDEX IF NOT EXISTS company_enabled_unit_standards_company_idx
  ON company_enabled_unit_standards (company_id, is_enabled, sort_order);
CREATE INDEX IF NOT EXISTS system_outsourcing_process_standards_active_idx
  ON system_outsourcing_process_standards (is_active, sort_order, name);
CREATE INDEX IF NOT EXISTS company_enabled_process_standards_company_idx
  ON company_enabled_process_standards (company_id, is_enabled, sort_order);
CREATE INDEX IF NOT EXISTS system_product_type_templates_active_idx
  ON system_product_type_templates (is_active, is_default, sort_order, name);
CREATE INDEX IF NOT EXISTS system_product_type_template_categories_template_idx
  ON system_product_type_template_categories (template_id, level, parent_id, sort_order, name);

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
