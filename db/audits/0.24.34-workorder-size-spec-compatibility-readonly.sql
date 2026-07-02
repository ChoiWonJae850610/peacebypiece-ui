WITH planned_relation_conflicts AS (
  SELECT relname
  FROM pg_class
  WHERE oid IN (
    to_regclass('public.workorder_size_specs'),
    to_regclass('public.workorder_size_spec_sizes'),
    to_regclass('public.workorder_size_spec_poms'),
    to_regclass('public.workorder_size_spec_values')
  )
),
required_foundation_missing AS (
  SELECT name
  FROM (VALUES
    ('public.spec_sheets'),
    ('public.attachments'),
    ('public.system_size_sets'),
    ('public.system_size_options'),
    ('public.company_size_set_activations'),
    ('public.system_pom_definitions'),
    ('public.company_pom_activations')
  ) AS required(name)
  WHERE to_regclass(required.name) IS NULL
)
SELECT 'planned_relation_conflict' AS finding, relname AS detail
FROM planned_relation_conflicts
UNION ALL
SELECT 'required_foundation_missing' AS finding, name AS detail
FROM required_foundation_missing;
