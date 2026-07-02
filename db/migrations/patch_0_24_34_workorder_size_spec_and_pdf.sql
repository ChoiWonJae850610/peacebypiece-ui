-- 0.24.34 Workorder Size Specification and Incomplete/Final PDF
-- Additive schema only. Existing workorders, companies, subscriptions, and attachments are not backfilled.

BEGIN;

CREATE TABLE IF NOT EXISTS workorder_size_specs (
  work_order_id text PRIMARY KEY REFERENCES spec_sheets(id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  size_set_code text REFERENCES system_size_sets(code) ON DELETE RESTRICT,
  measurement_unit text NOT NULL DEFAULT 'cm',
  source_catalog_version_code text REFERENCES system_catalog_versions(code) ON DELETE RESTRICT,
  updated_by_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workorder_size_specs_unit_check CHECK (measurement_unit IN ('cm', 'inch'))
);

CREATE INDEX IF NOT EXISTS workorder_size_specs_company_idx
  ON workorder_size_specs (company_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS workorder_size_spec_sizes (
  work_order_id text NOT NULL REFERENCES workorder_size_specs(work_order_id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  size_code text NOT NULL,
  display_label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (work_order_id, size_code),
  CONSTRAINT workorder_size_spec_sizes_code_check CHECK (length(trim(size_code)) > 0),
  CONSTRAINT workorder_size_spec_sizes_label_check CHECK (length(trim(display_label)) > 0)
);

CREATE INDEX IF NOT EXISTS workorder_size_spec_sizes_company_idx
  ON workorder_size_spec_sizes (company_id, work_order_id, sort_order);

CREATE TABLE IF NOT EXISTS workorder_size_spec_poms (
  work_order_id text NOT NULL REFERENCES workorder_size_specs(work_order_id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pom_code text NOT NULL,
  display_name text NOT NULL,
  measurement_type text NOT NULL,
  instruction text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (work_order_id, pom_code),
  CONSTRAINT workorder_size_spec_poms_code_check CHECK (length(trim(pom_code)) > 0),
  CONSTRAINT workorder_size_spec_poms_measurement_type_check CHECK (
    measurement_type IN ('circumference', 'half_flat', 'quarter_pattern_reference', 'length')
  )
);

CREATE INDEX IF NOT EXISTS workorder_size_spec_poms_company_idx
  ON workorder_size_spec_poms (company_id, work_order_id, sort_order);

CREATE TABLE IF NOT EXISTS workorder_size_spec_values (
  work_order_id text NOT NULL REFERENCES workorder_size_specs(work_order_id) ON DELETE CASCADE,
  size_code text NOT NULL,
  pom_code text NOT NULL,
  display_value text,
  decimal_value numeric(10, 3),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (work_order_id, size_code, pom_code),
  FOREIGN KEY (work_order_id, size_code)
    REFERENCES workorder_size_spec_sizes(work_order_id, size_code)
    ON DELETE CASCADE,
  FOREIGN KEY (work_order_id, pom_code)
    REFERENCES workorder_size_spec_poms(work_order_id, pom_code)
    ON DELETE CASCADE,
  CONSTRAINT workorder_size_spec_values_display_length_check CHECK (char_length(COALESCE(display_value, '')) <= 32),
  CONSTRAINT workorder_size_spec_values_decimal_check CHECK (decimal_value IS NULL OR decimal_value >= 0)
);

CREATE INDEX IF NOT EXISTS workorder_size_spec_values_lookup_idx
  ON workorder_size_spec_values (work_order_id, pom_code, size_code);

COMMIT;
