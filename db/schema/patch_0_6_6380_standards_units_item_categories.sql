-- =========================================
-- PeaceByPiece patch 0.6.6380
-- 기준 설정 DB 구조 1차 연결
-- - units.company_id 보완
-- - item_categories 고객사별 1/2/3차 품목분류 테이블 추가
-- =========================================

BEGIN;

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS company_id text;

UPDATE units
SET company_id = COALESCE(company_id, 'company-sample-customer')
WHERE company_id IS NULL;

ALTER TABLE units
  DROP CONSTRAINT IF EXISTS units_code_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'units_company_code_unique'
  ) THEN
    ALTER TABLE units
      ADD CONSTRAINT units_company_code_unique UNIQUE (company_id, code);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS item_categories (
  id text PRIMARY KEY,
  company_id text,
  parent_id text REFERENCES item_categories(id) ON DELETE CASCADE,
  level integer NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_categories_level_check CHECK (level IN (1, 2, 3))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'item_categories_company_parent_name_unique'
  ) THEN
    ALTER TABLE item_categories
      ADD CONSTRAINT item_categories_company_parent_name_unique UNIQUE (company_id, parent_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS units_company_active_idx
  ON units (company_id, is_active, sort_order, name);

CREATE INDEX IF NOT EXISTS item_categories_company_level_idx
  ON item_categories (company_id, level, sort_order, name);

CREATE INDEX IF NOT EXISTS item_categories_parent_idx
  ON item_categories (parent_id, sort_order, name);

INSERT INTO item_categories (id, company_id, parent_id, level, name, is_active, sort_order) VALUES
  ('category:상의', 'company-sample-customer', NULL, 1, '상의', true, 10),
  ('category:상의:티셔츠', 'company-sample-customer', 'category:상의', 2, '티셔츠', true, 10),
  ('category:상의:티셔츠:반팔', 'company-sample-customer', 'category:상의:티셔츠', 3, '반팔', true, 10),
  ('category:상의:티셔츠:긴팔', 'company-sample-customer', 'category:상의:티셔츠', 3, '긴팔', true, 20),
  ('category:상의:티셔츠:오버핏', 'company-sample-customer', 'category:상의:티셔츠', 3, '오버핏', true, 30),
  ('category:상의:셔츠', 'company-sample-customer', 'category:상의', 2, '셔츠', true, 20),
  ('category:상의:셔츠:베이직', 'company-sample-customer', 'category:상의:셔츠', 3, '베이직', true, 10),
  ('category:상의:셔츠:오버핏', 'company-sample-customer', 'category:상의:셔츠', 3, '오버핏', true, 20),
  ('category:상의:셔츠:크롭', 'company-sample-customer', 'category:상의:셔츠', 3, '크롭', true, 30),
  ('category:상의:니트', 'company-sample-customer', 'category:상의', 2, '니트', true, 30),
  ('category:상의:니트:라운드', 'company-sample-customer', 'category:상의:니트', 3, '라운드', true, 10),
  ('category:상의:니트:가디건', 'company-sample-customer', 'category:상의:니트', 3, '가디건', true, 20),
  ('category:상의:니트:베스트', 'company-sample-customer', 'category:상의:니트', 3, '베스트', true, 30),
  ('category:하의', 'company-sample-customer', NULL, 1, '하의', true, 20),
  ('category:하의:팬츠', 'company-sample-customer', 'category:하의', 2, '팬츠', true, 10),
  ('category:하의:팬츠:슬랙스', 'company-sample-customer', 'category:하의:팬츠', 3, '슬랙스', true, 10),
  ('category:하의:팬츠:와이드', 'company-sample-customer', 'category:하의:팬츠', 3, '와이드', true, 20),
  ('category:하의:팬츠:조거', 'company-sample-customer', 'category:하의:팬츠', 3, '조거', true, 30),
  ('category:하의:스커트', 'company-sample-customer', 'category:하의', 2, '스커트', true, 20),
  ('category:하의:스커트:미니', 'company-sample-customer', 'category:하의:스커트', 3, '미니', true, 10),
  ('category:하의:스커트:미디', 'company-sample-customer', 'category:하의:스커트', 3, '미디', true, 20),
  ('category:하의:스커트:롱', 'company-sample-customer', 'category:하의:스커트', 3, '롱', true, 30),
  ('category:하의:데님', 'company-sample-customer', 'category:하의', 2, '데님', true, 30),
  ('category:하의:데님:스트레이트', 'company-sample-customer', 'category:하의:데님', 3, '스트레이트', true, 10),
  ('category:하의:데님:와이드', 'company-sample-customer', 'category:하의:데님', 3, '와이드', true, 20),
  ('category:하의:데님:부츠컷', 'company-sample-customer', 'category:하의:데님', 3, '부츠컷', true, 30),
  ('category:아우터', 'company-sample-customer', NULL, 1, '아우터', true, 30),
  ('category:아우터:자켓', 'company-sample-customer', 'category:아우터', 2, '자켓', true, 10),
  ('category:아우터:자켓:테일러드', 'company-sample-customer', 'category:아우터:자켓', 3, '테일러드', true, 10),
  ('category:아우터:자켓:트위드', 'company-sample-customer', 'category:아우터:자켓', 3, '트위드', true, 20),
  ('category:아우터:자켓:크롭', 'company-sample-customer', 'category:아우터:자켓', 3, '크롭', true, 30),
  ('category:아우터:코트', 'company-sample-customer', 'category:아우터', 2, '코트', true, 20),
  ('category:아우터:코트:롱', 'company-sample-customer', 'category:아우터:코트', 3, '롱', true, 10),
  ('category:아우터:코트:하프', 'company-sample-customer', 'category:아우터:코트', 3, '하프', true, 20),
  ('category:아우터:코트:트렌치', 'company-sample-customer', 'category:아우터:코트', 3, '트렌치', true, 30),
  ('category:아우터:점퍼', 'company-sample-customer', 'category:아우터', 2, '점퍼', true, 30),
  ('category:아우터:점퍼:바람막이', 'company-sample-customer', 'category:아우터:점퍼', 3, '바람막이', true, 10),
  ('category:아우터:점퍼:패딩', 'company-sample-customer', 'category:아우터:점퍼', 3, '패딩', true, 20),
  ('category:아우터:점퍼:블루종', 'company-sample-customer', 'category:아우터:점퍼', 3, '블루종', true, 30)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  parent_id = EXCLUDED.parent_id,
  level = EXCLUDED.level,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

COMMIT;
