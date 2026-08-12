-- WAFL v2 alpha.62 additive dev/test migration.
-- Production execution, backfill, and destructive SQL are forbidden.

BEGIN;

DO $alpha62_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.62-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 014 requires the approved alpha.62 dev/test runner';
  END IF;
END
$alpha62_gate$;

CREATE TABLE public.size_spec_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text REFERENCES public.companies(id) ON DELETE RESTRICT,
  source_kind text NOT NULL,
  name text NOT NULL,
  gender_code text,
  category_code text,
  size_set_code text REFERENCES public.system_size_sets(code) ON DELETE RESTRICT,
  template_version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by_member_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT size_spec_templates_source_owner_check CHECK (
    (source_kind = 'system' AND company_id IS NULL) OR
    (source_kind = 'company' AND company_id IS NOT NULL)
  ),
  CONSTRAINT size_spec_templates_source_kind_check CHECK (source_kind IN ('system', 'company')),
  CONSTRAINT size_spec_templates_name_check CHECK (length(trim(name)) BETWEEN 1 AND 120),
  CONSTRAINT size_spec_templates_version_check CHECK (template_version >= 1),
  CONSTRAINT size_spec_templates_company_id_id_unique UNIQUE (company_id, id)
);

CREATE TABLE public.size_spec_template_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.size_spec_templates(id) ON DELETE RESTRICT,
  size_code text NOT NULL,
  display_label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  CONSTRAINT size_spec_template_sizes_code_unique UNIQUE (template_id, size_code),
  CONSTRAINT size_spec_template_sizes_order_check CHECK (display_order >= 0)
);

CREATE TABLE public.size_spec_template_poms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.size_spec_templates(id) ON DELETE RESTRICT,
  pom_code text NOT NULL,
  display_name text NOT NULL,
  measurement_type text NOT NULL,
  instruction text,
  display_order integer NOT NULL DEFAULT 0,
  CONSTRAINT size_spec_template_poms_code_unique UNIQUE (template_id, pom_code),
  CONSTRAINT size_spec_template_poms_type_check CHECK (measurement_type IN ('circumference', 'half_flat', 'quarter_pattern_reference', 'length')),
  CONSTRAINT size_spec_template_poms_order_check CHECK (display_order >= 0)
);

CREATE TABLE public.size_spec_template_values (
  template_id uuid NOT NULL REFERENCES public.size_spec_templates(id) ON DELETE RESTRICT,
  size_row_id uuid NOT NULL REFERENCES public.size_spec_template_sizes(id) ON DELETE RESTRICT,
  pom_column_id uuid NOT NULL REFERENCES public.size_spec_template_poms(id) ON DELETE RESTRICT,
  decimal_value numeric(14, 4),
  display_fraction text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (template_id, size_row_id, pom_column_id),
  CONSTRAINT size_spec_template_values_decimal_check CHECK (decimal_value IS NULL OR (decimal_value >= 0 AND decimal_value <= 1000))
);

CREATE INDEX size_spec_templates_compatible_active_idx
  ON public.size_spec_templates (source_kind, company_id, category_code, gender_code, id)
  WHERE is_active;
CREATE INDEX size_spec_template_sizes_order_idx ON public.size_spec_template_sizes (template_id, display_order, id);
CREATE INDEX size_spec_template_poms_order_idx ON public.size_spec_template_poms (template_id, display_order, id);

ALTER TABLE public.size_spec_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_spec_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.size_spec_template_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_spec_template_sizes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.size_spec_template_poms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_spec_template_poms FORCE ROW LEVEL SECURITY;
ALTER TABLE public.size_spec_template_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_spec_template_values FORCE ROW LEVEL SECURITY;

CREATE POLICY size_spec_templates_tenant_read ON public.size_spec_templates
  FOR SELECT USING (company_id IS NULL OR company_id = public.wafl_v2_request_company_id());
CREATE POLICY size_spec_templates_tenant_company_write ON public.size_spec_templates
  FOR ALL USING (source_kind = 'company' AND company_id = public.wafl_v2_request_company_id())
  WITH CHECK (source_kind = 'company' AND company_id = public.wafl_v2_request_company_id());
CREATE POLICY size_spec_template_sizes_tenant_read ON public.size_spec_template_sizes
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND (t.company_id IS NULL OR t.company_id = public.wafl_v2_request_company_id())));
CREATE POLICY size_spec_template_sizes_tenant_company_write ON public.size_spec_template_sizes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND t.source_kind = 'company' AND t.company_id = public.wafl_v2_request_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND t.source_kind = 'company' AND t.company_id = public.wafl_v2_request_company_id()));
CREATE POLICY size_spec_template_poms_tenant_read ON public.size_spec_template_poms
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND (t.company_id IS NULL OR t.company_id = public.wafl_v2_request_company_id())));
CREATE POLICY size_spec_template_poms_tenant_company_write ON public.size_spec_template_poms
  FOR ALL USING (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND t.source_kind = 'company' AND t.company_id = public.wafl_v2_request_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND t.source_kind = 'company' AND t.company_id = public.wafl_v2_request_company_id()));
CREATE POLICY size_spec_template_values_tenant_read ON public.size_spec_template_values
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND (t.company_id IS NULL OR t.company_id = public.wafl_v2_request_company_id())));
CREATE POLICY size_spec_template_values_tenant_company_write ON public.size_spec_template_values
  FOR ALL USING (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND t.source_kind = 'company' AND t.company_id = public.wafl_v2_request_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.size_spec_templates t WHERE t.id = template_id AND t.source_kind = 'company' AND t.company_id = public.wafl_v2_request_company_id()));

GRANT SELECT, INSERT, UPDATE ON TABLE public.size_spec_templates, public.size_spec_template_sizes, public.size_spec_template_poms, public.size_spec_template_values TO wafl_v2_tenant_runtime;

COMMIT;
