-- WAFL v2 alpha.73 additive Drawing Scene persistence migration.
-- Approved for the canonical development/test target only. Production execution is forbidden.

BEGIN;

DO $alpha73_gate$
BEGIN
  IF pg_catalog.current_setting('wafl.runtime_environment', true) NOT IN ('development', 'test')
     OR pg_catalog.current_setting('wafl.migration_execution_approved', true)
        IS DISTINCT FROM '2.0.0-alpha.73-work-order-drawing-dev-test-reviewed' THEN
    RAISE EXCEPTION 'WAFL v2 migration 022 requires the approved alpha.73 dev/test runner';
  END IF;
END
$alpha73_gate$;

CREATE UNIQUE INDEX IF NOT EXISTS work_order_revisions_company_work_order_id_unique_idx
  ON public.work_order_revisions (company_id, work_order_id, id);

CREATE TABLE public.work_order_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  work_order_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  slot_key varchar(32) NOT NULL,
  schema_version integer NOT NULL,
  scene_json jsonb NOT NULL,
  entity_version integer NOT NULL DEFAULT 1,
  created_by_member_id text REFERENCES public.company_members(id) ON DELETE SET NULL,
  updated_by_member_id text REFERENCES public.company_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_order_drawings_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT work_order_drawings_revision_slot_unique UNIQUE (company_id, revision_id, slot_key),
  CONSTRAINT work_order_drawings_work_order_revision_company_fk
    FOREIGN KEY (company_id, work_order_id, revision_id)
    REFERENCES public.work_order_revisions (company_id, work_order_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT work_order_drawings_schema_version_check CHECK (schema_version = 1),
  CONSTRAINT work_order_drawings_entity_version_check CHECK (entity_version >= 1),
  CONSTRAINT work_order_drawings_slot_key_check CHECK (slot_key ~ '^[a-z][a-z0-9_-]{0,31}$'),
  CONSTRAINT work_order_drawings_scene_shape_check CHECK (
    jsonb_typeof(scene_json) = 'object'
    AND scene_json->>'schemaVersion' = '1'
    AND jsonb_typeof(scene_json->'elements') = 'array'
  )
);

CREATE INDEX work_order_drawings_work_order_idx
  ON public.work_order_drawings (company_id, work_order_id, updated_at DESC, id DESC);

ALTER TABLE public.work_order_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_drawings FORCE ROW LEVEL SECURITY;

CREATE POLICY work_order_drawings_tenant_access
  ON public.work_order_drawings FOR ALL
  USING (company_id = wafl_v2_request_company_id())
  WITH CHECK (company_id = wafl_v2_request_company_id());

CREATE POLICY work_order_drawings_privileged_system_access
  ON public.work_order_drawings FOR ALL
  USING (wafl_v2_privileged_scope_ready(company_id))
  WITH CHECK (wafl_v2_privileged_scope_ready(company_id));

GRANT SELECT, INSERT, UPDATE ON TABLE public.work_order_drawings TO wafl_v2_tenant_runtime;

COMMIT;
