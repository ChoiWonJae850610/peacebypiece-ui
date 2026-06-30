-- 0.24.27 System Catalog, Sizes, and POM
-- Additive schema only. Existing company catalog rows are not backfilled by this migration.

BEGIN;

CREATE TABLE IF NOT EXISTS system_catalog_versions (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'current',
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_catalog_versions_status_check CHECK (status IN ('draft', 'current', 'archived')),
  CONSTRAINT system_catalog_versions_code_check CHECK (length(trim(code)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS system_catalog_versions_single_current_idx
  ON system_catalog_versions (is_current)
  WHERE is_current = true;

CREATE TABLE IF NOT EXISTS system_catalog_categories (
  id text PRIMARY KEY,
  catalog_version_code text NOT NULL REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  parent_code text REFERENCES system_catalog_categories(code) ON DELETE RESTRICT,
  depth integer NOT NULL,
  domain text NOT NULL,
  display_name text NOT NULL,
  default_enabled boolean NOT NULL DEFAULT true,
  is_optional boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_catalog_categories_depth_check CHECK (depth IN (1, 2, 3)),
  CONSTRAINT system_catalog_categories_domain_check CHECK (domain IN ('apparel', 'underwear', 'accessory')),
  CONSTRAINT system_catalog_categories_code_check CHECK (code ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){0,3}$'),
  CONSTRAINT system_catalog_categories_parent_depth_check CHECK (
    (depth = 1 AND parent_code IS NULL)
    OR (depth IN (2, 3) AND parent_code IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS system_catalog_categories_tree_idx
  ON system_catalog_categories (catalog_version_code, parent_code, depth, sort_order, code);

CREATE TABLE IF NOT EXISTS company_catalog_categories (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_code text NOT NULL REFERENCES system_catalog_categories(code) ON DELETE RESTRICT,
  catalog_version_code text NOT NULL REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  is_enabled boolean NOT NULL DEFAULT true,
  provisioned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, category_code)
);

CREATE INDEX IF NOT EXISTS company_catalog_categories_company_enabled_idx
  ON company_catalog_categories (company_id, is_enabled, category_code);

CREATE TABLE IF NOT EXISTS system_size_sets (
  id text PRIMARY KEY,
  catalog_version_code text NOT NULL REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_custom_allowed boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_size_options (
  id text PRIMARY KEY,
  size_set_code text NOT NULL REFERENCES system_size_sets(code) ON DELETE CASCADE,
  code text NOT NULL,
  display_label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (size_set_code, code)
);

CREATE TABLE IF NOT EXISTS system_category_size_sets (
  category_code text NOT NULL REFERENCES system_catalog_categories(code) ON DELETE CASCADE,
  size_set_code text NOT NULL REFERENCES system_size_sets(code) ON DELETE CASCADE,
  PRIMARY KEY (category_code, size_set_code)
);

CREATE TABLE IF NOT EXISTS company_size_set_activations (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  size_set_code text NOT NULL REFERENCES system_size_sets(code) ON DELETE RESTRICT,
  catalog_version_code text NOT NULL REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  is_enabled boolean NOT NULL DEFAULT true,
  provisioned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, size_set_code)
);

CREATE TABLE IF NOT EXISTS system_pom_definitions (
  id text PRIMARY KEY,
  catalog_version_code text NOT NULL REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  measurement_unit text NOT NULL DEFAULT 'cm',
  measurement_type text NOT NULL,
  instruction text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_pom_definitions_measurement_type_check CHECK (
    measurement_type IN ('circumference', 'half_flat', 'quarter_pattern_reference', 'length')
  ),
  CONSTRAINT system_pom_definitions_unit_check CHECK (measurement_unit IN ('cm', 'inch'))
);

CREATE TABLE IF NOT EXISTS system_category_poms (
  category_code text NOT NULL REFERENCES system_catalog_categories(code) ON DELETE CASCADE,
  pom_code text NOT NULL REFERENCES system_pom_definitions(code) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (category_code, pom_code)
);

CREATE TABLE IF NOT EXISTS company_pom_activations (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pom_code text NOT NULL REFERENCES system_pom_definitions(code) ON DELETE RESTRICT,
  catalog_version_code text NOT NULL REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  is_enabled boolean NOT NULL DEFAULT true,
  provisioned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, pom_code)
);

CREATE TABLE IF NOT EXISTS company_catalog_provisioning (
  company_id text PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  catalog_version_code text NOT NULL REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  provisioned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO system_catalog_versions (id, code, label, status, is_current)
VALUES (
  'wafl-system-catalog-2026-0.24.27',
  'wafl-system-catalog-2026-0.24.27',
  'WAFL System Catalog 0.24.27',
  'current',
  true
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO system_catalog_categories (
  id, catalog_version_code, code, parent_code, depth, domain, display_name,
  default_enabled, is_optional, is_active, sort_order
)
VALUES
  ('apparel.top', 'wafl-system-catalog-2026-0.24.27', 'apparel.top', NULL, 1, 'apparel', 'Top', true, false, true, 10),
  ('apparel.top.tshirt', 'wafl-system-catalog-2026-0.24.27', 'apparel.top.tshirt', 'apparel.top', 2, 'apparel', 'T-shirt', true, false, true, 10),
  ('apparel.top.tshirt.short_sleeve', 'wafl-system-catalog-2026-0.24.27', 'apparel.top.tshirt.short_sleeve', 'apparel.top.tshirt', 3, 'apparel', 'Short sleeve', true, false, true, 10),
  ('apparel.top.shirt_blouse', 'wafl-system-catalog-2026-0.24.27', 'apparel.top.shirt_blouse', 'apparel.top', 2, 'apparel', 'Shirt/Blouse', true, false, true, 20),
  ('apparel.top.shirt_blouse.blouse', 'wafl-system-catalog-2026-0.24.27', 'apparel.top.shirt_blouse.blouse', 'apparel.top.shirt_blouse', 3, 'apparel', 'Blouse', true, false, true, 10),
  ('apparel.bottom', 'wafl-system-catalog-2026-0.24.27', 'apparel.bottom', NULL, 1, 'apparel', 'Bottom', true, false, true, 20),
  ('apparel.bottom.pants', 'wafl-system-catalog-2026-0.24.27', 'apparel.bottom.pants', 'apparel.bottom', 2, 'apparel', 'Pants', true, false, true, 10),
  ('apparel.bottom.pants.slacks', 'wafl-system-catalog-2026-0.24.27', 'apparel.bottom.pants.slacks', 'apparel.bottom.pants', 3, 'apparel', 'Slacks', true, false, true, 10),
  ('apparel.outer', 'wafl-system-catalog-2026-0.24.27', 'apparel.outer', NULL, 1, 'apparel', 'Outer', true, false, true, 30),
  ('apparel.outer.jacket', 'wafl-system-catalog-2026-0.24.27', 'apparel.outer.jacket', 'apparel.outer', 2, 'apparel', 'Jacket', true, false, true, 10),
  ('apparel.outer.jacket.tailored', 'wafl-system-catalog-2026-0.24.27', 'apparel.outer.jacket.tailored', 'apparel.outer.jacket', 3, 'apparel', 'Tailored jacket', true, false, true, 10),
  ('apparel.onepiece_set', 'wafl-system-catalog-2026-0.24.27', 'apparel.onepiece_set', NULL, 1, 'apparel', 'One-piece/Set', true, false, true, 40),
  ('apparel.onepiece_set.dress', 'wafl-system-catalog-2026-0.24.27', 'apparel.onepiece_set.dress', 'apparel.onepiece_set', 2, 'apparel', 'Dress', true, false, true, 10),
  ('apparel.onepiece_set.dress.midi', 'wafl-system-catalog-2026-0.24.27', 'apparel.onepiece_set.dress.midi', 'apparel.onepiece_set.dress', 3, 'apparel', 'Midi dress', true, false, true, 10),
  ('underwear.bra', 'wafl-system-catalog-2026-0.24.27', 'underwear.bra', NULL, 1, 'underwear', 'Bra', false, true, true, 110),
  ('underwear.bra.general', 'wafl-system-catalog-2026-0.24.27', 'underwear.bra.general', 'underwear.bra', 2, 'underwear', 'General', false, true, true, 10),
  ('underwear.bra.general.wire', 'wafl-system-catalog-2026-0.24.27', 'underwear.bra.general.wire', 'underwear.bra.general', 3, 'underwear', 'Wire', false, true, true, 10),
  ('underwear.panties', 'wafl-system-catalog-2026-0.24.27', 'underwear.panties', NULL, 1, 'underwear', 'Panties', false, true, true, 120),
  ('underwear.panties.women', 'wafl-system-catalog-2026-0.24.27', 'underwear.panties.women', 'underwear.panties', 2, 'underwear', 'Women', false, true, true, 10),
  ('underwear.panties.women.brief', 'wafl-system-catalog-2026-0.24.27', 'underwear.panties.women.brief', 'underwear.panties.women', 3, 'underwear', 'Brief', false, true, true, 10),
  ('underwear.innerwear', 'wafl-system-catalog-2026-0.24.27', 'underwear.innerwear', NULL, 1, 'underwear', 'Innerwear', false, true, true, 130),
  ('underwear.innerwear.top', 'wafl-system-catalog-2026-0.24.27', 'underwear.innerwear.top', 'underwear.innerwear', 2, 'underwear', 'Top', false, true, true, 10),
  ('underwear.innerwear.top.camisole', 'wafl-system-catalog-2026-0.24.27', 'underwear.innerwear.top.camisole', 'underwear.innerwear.top', 3, 'underwear', 'Camisole', false, true, true, 10),
  ('underwear.sleepwear', 'wafl-system-catalog-2026-0.24.27', 'underwear.sleepwear', NULL, 1, 'underwear', 'Sleepwear', false, true, true, 140),
  ('underwear.sleepwear.set', 'wafl-system-catalog-2026-0.24.27', 'underwear.sleepwear.set', 'underwear.sleepwear', 2, 'underwear', 'Set', false, true, true, 10),
  ('underwear.sleepwear.set.pajama', 'wafl-system-catalog-2026-0.24.27', 'underwear.sleepwear.set.pajama', 'underwear.sleepwear.set', 3, 'underwear', 'Pajama', false, true, true, 10),
  ('accessory.bag', 'wafl-system-catalog-2026-0.24.27', 'accessory.bag', NULL, 1, 'accessory', 'Bag', false, true, true, 210),
  ('accessory.bag.tote', 'wafl-system-catalog-2026-0.24.27', 'accessory.bag.tote', 'accessory.bag', 2, 'accessory', 'Tote', false, true, true, 10),
  ('accessory.bag.tote.basic', 'wafl-system-catalog-2026-0.24.27', 'accessory.bag.tote.basic', 'accessory.bag.tote', 3, 'accessory', 'Basic tote', false, true, true, 10),
  ('accessory.hat', 'wafl-system-catalog-2026-0.24.27', 'accessory.hat', NULL, 1, 'accessory', 'Hat', false, true, true, 220),
  ('accessory.hat.cap', 'wafl-system-catalog-2026-0.24.27', 'accessory.hat.cap', 'accessory.hat', 2, 'accessory', 'Cap', false, true, true, 10),
  ('accessory.hat.cap.basic', 'wafl-system-catalog-2026-0.24.27', 'accessory.hat.cap.basic', 'accessory.hat.cap', 3, 'accessory', 'Basic cap', false, true, true, 10),
  ('accessory.belt', 'wafl-system-catalog-2026-0.24.27', 'accessory.belt', NULL, 1, 'accessory', 'Belt', false, true, true, 230),
  ('accessory.belt.general', 'wafl-system-catalog-2026-0.24.27', 'accessory.belt.general', 'accessory.belt', 2, 'accessory', 'General', false, true, true, 10),
  ('accessory.belt.general.basic', 'wafl-system-catalog-2026-0.24.27', 'accessory.belt.general.basic', 'accessory.belt.general', 3, 'accessory', 'Basic belt', false, true, true, 10),
  ('accessory.scarf_muffler', 'wafl-system-catalog-2026-0.24.27', 'accessory.scarf_muffler', NULL, 1, 'accessory', 'Scarf/Muffler', false, true, true, 240),
  ('accessory.scarf_muffler.scarf', 'wafl-system-catalog-2026-0.24.27', 'accessory.scarf_muffler.scarf', 'accessory.scarf_muffler', 2, 'accessory', 'Scarf', false, true, true, 10),
  ('accessory.scarf_muffler.scarf.basic', 'wafl-system-catalog-2026-0.24.27', 'accessory.scarf_muffler.scarf.basic', 'accessory.scarf_muffler.scarf', 3, 'accessory', 'Basic scarf', false, true, true, 10),
  ('accessory.socks_legwear', 'wafl-system-catalog-2026-0.24.27', 'accessory.socks_legwear', NULL, 1, 'accessory', 'Socks/Legwear', false, true, true, 250),
  ('accessory.socks_legwear.socks', 'wafl-system-catalog-2026-0.24.27', 'accessory.socks_legwear.socks', 'accessory.socks_legwear', 2, 'accessory', 'Socks', false, true, true, 10),
  ('accessory.socks_legwear.socks.basic', 'wafl-system-catalog-2026-0.24.27', 'accessory.socks_legwear.socks.basic', 'accessory.socks_legwear.socks', 3, 'accessory', 'Basic socks', false, true, true, 10),
  ('accessory.jewelry', 'wafl-system-catalog-2026-0.24.27', 'accessory.jewelry', NULL, 1, 'accessory', 'Jewelry', false, true, true, 260),
  ('accessory.jewelry.necklace', 'wafl-system-catalog-2026-0.24.27', 'accessory.jewelry.necklace', 'accessory.jewelry', 2, 'accessory', 'Necklace', false, true, true, 10),
  ('accessory.jewelry.necklace.basic', 'wafl-system-catalog-2026-0.24.27', 'accessory.jewelry.necklace.basic', 'accessory.jewelry.necklace', 3, 'accessory', 'Basic necklace', false, true, true, 10),
  ('accessory.other', 'wafl-system-catalog-2026-0.24.27', 'accessory.other', NULL, 1, 'accessory', 'Other accessory', false, true, true, 270),
  ('accessory.other.misc', 'wafl-system-catalog-2026-0.24.27', 'accessory.other.misc', 'accessory.other', 2, 'accessory', 'Miscellaneous', false, true, true, 10),
  ('accessory.other.misc.basic', 'wafl-system-catalog-2026-0.24.27', 'accessory.other.misc.basic', 'accessory.other.misc', 3, 'accessory', 'Basic accessory', false, true, true, 10)
ON CONFLICT (code) DO NOTHING;

INSERT INTO system_size_sets (id, catalog_version_code, code, display_name, is_custom_allowed, sort_order)
VALUES
  ('alpha_xs_xl', 'wafl-system-catalog-2026-0.24.27', 'alpha_xs_xl', 'XS-XL', true, 10),
  ('women_55_77', 'wafl-system-catalog-2026-0.24.27', 'women_55_77', 'Women 55/66/77', true, 20),
  ('men_90_105', 'wafl-system-catalog-2026-0.24.27', 'men_90_105', 'Men 90/95/100/105', true, 30),
  ('free', 'wafl-system-catalog-2026-0.24.27', 'free', 'Free', true, 40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO system_size_options (id, size_set_code, code, display_label, sort_order)
VALUES
  ('alpha_xs_xl:xs', 'alpha_xs_xl', 'xs', 'XS', 10),
  ('alpha_xs_xl:s', 'alpha_xs_xl', 's', 'S', 20),
  ('alpha_xs_xl:m', 'alpha_xs_xl', 'm', 'M', 30),
  ('alpha_xs_xl:l', 'alpha_xs_xl', 'l', 'L', 40),
  ('alpha_xs_xl:xl', 'alpha_xs_xl', 'xl', 'XL', 50),
  ('women_55_77:w55', 'women_55_77', 'w55', '55', 10),
  ('women_55_77:w66', 'women_55_77', 'w66', '66', 20),
  ('women_55_77:w77', 'women_55_77', 'w77', '77', 30),
  ('men_90_105:m90', 'men_90_105', 'm90', '90', 10),
  ('men_90_105:m95', 'men_90_105', 'm95', '95', 20),
  ('men_90_105:m100', 'men_90_105', 'm100', '100', 30),
  ('men_90_105:m105', 'men_90_105', 'm105', '105', 40),
  ('free:free', 'free', 'free', 'FREE', 10)
ON CONFLICT (size_set_code, code) DO NOTHING;

INSERT INTO system_pom_definitions (
  id, catalog_version_code, code, display_name, measurement_unit,
  measurement_type, instruction, sort_order, is_active
)
VALUES
  ('body_length', 'wafl-system-catalog-2026-0.24.27', 'body_length', 'Body length', 'cm', 'length', 'Measure actual garment length.', 10, true),
  ('shoulder_width', 'wafl-system-catalog-2026-0.24.27', 'shoulder_width', 'Shoulder width', 'cm', 'half_flat', 'Measure flat shoulder width.', 20, true),
  ('chest_width', 'wafl-system-catalog-2026-0.24.27', 'chest_width', 'Chest width', 'cm', 'half_flat', 'Measure finished garment flat chest.', 30, true),
  ('waist_width', 'wafl-system-catalog-2026-0.24.27', 'waist_width', 'Waist width', 'cm', 'half_flat', 'Measure finished garment flat waist.', 40, true),
  ('hip_width', 'wafl-system-catalog-2026-0.24.27', 'hip_width', 'Hip width', 'cm', 'half_flat', 'Measure finished garment flat hip.', 50, true),
  ('sleeve_length', 'wafl-system-catalog-2026-0.24.27', 'sleeve_length', 'Sleeve length', 'cm', 'length', 'Measure actual sleeve length.', 60, true),
  ('hem_width', 'wafl-system-catalog-2026-0.24.27', 'hem_width', 'Hem width', 'cm', 'half_flat', 'Measure finished garment flat hem.', 70, true),
  ('head_circumference', 'wafl-system-catalog-2026-0.24.27', 'head_circumference', 'Head circumference', 'cm', 'circumference', 'Measure full head circumference for hats.', 80, true),
  ('bag_width', 'wafl-system-catalog-2026-0.24.27', 'bag_width', 'Bag width', 'cm', 'length', 'Measure actual bag width.', 90, true)
ON CONFLICT (code) DO NOTHING;

COMMIT;
