-- WAFL v2 alpha.21 additive migration draft.
-- EXECUTION IS PROHIBITED IN ALPHA.21. Do not run this file against any database.
-- Requires the separately approved dev/test gate and migrations 001-002. Production execution is forbidden.

BEGIN;

SELECT wafl_v2_assert_migration_draft_gate();

CREATE TABLE IF NOT EXISTS work_order_material_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  material_id text REFERENCES materials(id) ON DELETE SET NULL,
  material_type text NOT NULL,
  name text NOT NULL,
  color_option text,
  supplier_partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  required_quantity numeric(14, 3) NOT NULL DEFAULT 0,
  allowance_quantity numeric(14, 3) NOT NULL DEFAULT 0,
  inventory_usage_quantity numeric(14, 3) NOT NULL DEFAULT 0,
  order_quantity numeric(14, 3) NOT NULL DEFAULT 0,
  unit_code text NOT NULL,
  unit_price numeric(14, 2) NOT NULL DEFAULT 0,
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  overage_disposition text,
  status text NOT NULL DEFAULT 'editing',
  memo text,
  display_order integer NOT NULL DEFAULT 0,
  image_id uuid,
  requested_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  entity_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_material_lines_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_material_lines_type_check CHECK (material_type IN ('fabric', 'accessory')),
  CONSTRAINT work_order_material_lines_status_check CHECK (
    status IN ('editing', 'requested', 'completed', 'cancelled')
  ),
  CONSTRAINT work_order_material_lines_quantity_check CHECK (
    required_quantity >= 0 AND allowance_quantity >= 0
    AND inventory_usage_quantity >= 0 AND order_quantity >= 0
  ),
  CONSTRAINT work_order_material_lines_amount_check CHECK (unit_price >= 0 AND amount >= 0),
  CONSTRAINT work_order_material_lines_display_order_check CHECK (display_order >= 0),
  CONSTRAINT work_order_material_lines_entity_version_check CHECK (entity_version >= 1)
);

CREATE TABLE IF NOT EXISTS work_order_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  color_code text,
  display_name text NOT NULL,
  hex_value varchar(7),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_colors_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_colors_code_unique UNIQUE (revision_id, color_code),
  CONSTRAINT work_order_colors_hex_check CHECK (
    hex_value IS NULL OR hex_value ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT work_order_colors_display_order_check CHECK (display_order >= 0)
);

CREATE TABLE IF NOT EXISTS work_order_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  size_code text NOT NULL,
  display_label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_sizes_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_sizes_code_unique UNIQUE (revision_id, size_code),
  CONSTRAINT work_order_sizes_display_order_check CHECK (display_order >= 0)
);

CREATE TABLE IF NOT EXISTS color_size_quantities (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  color_id uuid NOT NULL REFERENCES work_order_colors(id) ON DELETE RESTRICT,
  size_id uuid NOT NULL REFERENCES work_order_sizes(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (revision_id, color_id, size_id),
  CONSTRAINT color_size_quantities_quantity_check CHECK (quantity >= 0)
);

CREATE TABLE IF NOT EXISTS work_order_size_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL UNIQUE REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  gender_code text,
  category_code text,
  measurement_unit text NOT NULL DEFAULT 'cm',
  source_template_id text,
  source_template_version integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_size_specs_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_size_specs_unit_check CHECK (measurement_unit IN ('cm', 'inch')),
  CONSTRAINT work_order_size_specs_template_version_check CHECK (
    source_template_version IS NULL OR source_template_version >= 1
  )
);

CREATE TABLE IF NOT EXISTS work_order_size_spec_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  size_spec_id uuid NOT NULL REFERENCES work_order_size_specs(id) ON DELETE RESTRICT,
  size_code text NOT NULL,
  display_label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_size_spec_sizes_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_size_spec_sizes_code_unique UNIQUE (size_spec_id, size_code),
  CONSTRAINT work_order_size_spec_sizes_display_order_check CHECK (display_order >= 0)
);

CREATE TABLE IF NOT EXISTS work_order_size_spec_poms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  size_spec_id uuid NOT NULL REFERENCES work_order_size_specs(id) ON DELETE RESTRICT,
  pom_code text NOT NULL,
  display_name text NOT NULL,
  measurement_type text NOT NULL,
  instruction text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_size_spec_poms_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_size_spec_poms_code_unique UNIQUE (size_spec_id, pom_code),
  CONSTRAINT work_order_size_spec_poms_type_check CHECK (
    measurement_type IN ('circumference', 'half_flat', 'quarter_pattern_reference', 'length')
  ),
  CONSTRAINT work_order_size_spec_poms_display_order_check CHECK (display_order >= 0)
);

CREATE TABLE IF NOT EXISTS work_order_size_spec_values (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  size_spec_id uuid NOT NULL REFERENCES work_order_size_specs(id) ON DELETE RESTRICT,
  size_row_id uuid NOT NULL REFERENCES work_order_size_spec_sizes(id) ON DELETE RESTRICT,
  pom_column_id uuid NOT NULL REFERENCES work_order_size_spec_poms(id) ON DELETE RESTRICT,
  decimal_value numeric(14, 4),
  display_fraction text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (size_spec_id, size_row_id, pom_column_id),
  CONSTRAINT work_order_size_spec_values_decimal_check CHECK (
    decimal_value IS NULL OR decimal_value >= 0
  )
);

CREATE TABLE IF NOT EXISTS work_order_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  revision_id uuid NOT NULL REFERENCES work_order_revisions(id) ON DELETE RESTRICT,
  process_type_code text NOT NULL,
  process_name_snapshot text NOT NULL,
  partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  partner_name_snapshot text,
  quantity numeric(14, 3) NOT NULL DEFAULT 0,
  due_date date,
  unit_code text NOT NULL,
  unit_price numeric(14, 2) NOT NULL DEFAULT 0,
  amount numeric(14, 2) NOT NULL DEFAULT 0,
  memo text,
  status text NOT NULL DEFAULT 'ready',
  display_order integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  completed_by_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  entity_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_processes_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_processes_status_check CHECK (status IN ('ready', 'in_progress', 'completed')),
  CONSTRAINT work_order_processes_quantity_check CHECK (quantity >= 0),
  CONSTRAINT work_order_processes_amount_check CHECK (unit_price >= 0 AND amount >= 0),
  CONSTRAINT work_order_processes_display_order_check CHECK (display_order >= 0),
  CONSTRAINT work_order_processes_entity_version_check CHECK (entity_version >= 1)
);

CREATE OR REPLACE FUNCTION wafl_v2_guard_mutable_revision_child()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  old_revision_id uuid;
  new_revision_id uuid;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    old_revision_id := nullif(to_jsonb(OLD)->>'revision_id', '')::uuid;
    IF NOT EXISTS (
      SELECT 1
      FROM work_order_revisions
      WHERE id = old_revision_id
        AND company_id = OLD.company_id
        AND revision_status = 'draft'
    ) THEN
      RAISE EXCEPTION 'revision-scoped child rows are immutable after finalization';
    END IF;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    new_revision_id := nullif(to_jsonb(NEW)->>'revision_id', '')::uuid;
    IF NOT EXISTS (
      SELECT 1
      FROM work_order_revisions
      WHERE id = new_revision_id
        AND company_id = NEW.company_id
        AND revision_status = 'draft'
    ) THEN
      RAISE EXCEPTION 'revision-scoped child rows require a mutable draft revision';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$function$;

DO $revision_child_guards$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'work_order_material_lines',
    'work_order_colors',
    'work_order_sizes',
    'color_size_quantities',
    'work_order_size_specs',
    'work_order_size_spec_sizes',
    'work_order_size_spec_poms',
    'work_order_size_spec_values',
    'work_order_processes'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION wafl_v2_guard_mutable_revision_child()',
      table_name || '_mutable_revision_guard',
      table_name
    );
  END LOOP;
END
$revision_child_guards$;

DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'work_order_material_lines',
    'work_order_colors',
    'work_order_sizes',
    'color_size_quantities',
    'work_order_size_specs',
    'work_order_size_spec_sizes',
    'work_order_size_spec_poms',
    'work_order_size_spec_values',
    'work_order_processes'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (company_id = wafl_v2_request_company_id()) WITH CHECK (company_id = wafl_v2_request_company_id())',
      table_name || '_tenant_access',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (wafl_v2_privileged_scope_ready(company_id)) WITH CHECK (wafl_v2_privileged_scope_ready(company_id))',
      table_name || '_privileged_system_access',
      table_name
    );
  END LOOP;
END
$rls$;

COMMIT;
