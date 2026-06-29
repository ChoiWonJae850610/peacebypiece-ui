WITH required_relation(relation_name) AS (
  VALUES
    ('signup_applications')
),
required_presence AS (
  SELECT
    required_relation.relation_name,
    pg_class.relkind
  FROM required_relation
  LEFT JOIN pg_class
    ON pg_class.relname = required_relation.relation_name
   AND pg_class.relnamespace = 'public'::regnamespace
)
SELECT
  'required_relation' AS section,
  relation_name AS item,
  CASE
    WHEN relkind IS NULL THEN 'missing'
    WHEN relkind NOT IN ('r', 'p') THEN 'wrong_relation_kind'
    ELSE 'present'
  END AS status,
  COALESCE(relkind::text, 'missing') AS detail
FROM required_presence
WHERE relkind IS NULL OR relkind NOT IN ('r', 'p');

WITH future_relations(relation_name) AS (
  VALUES
    ('signup_application_consents')
),
future_presence AS (
  SELECT
    future_relations.relation_name,
    pg_class.relkind
  FROM future_relations
  LEFT JOIN pg_class
    ON pg_class.relname = future_relations.relation_name
   AND pg_class.relnamespace = 'public'::regnamespace
)
SELECT
  'future_relation' AS section,
  relation_name AS item,
  CASE WHEN relkind IS NULL THEN 'available' ELSE 'already_exists' END AS status,
  COALESCE(relkind::text, 'available') AS detail
FROM future_presence
WHERE relkind IS NOT NULL;

WITH planned_names(name_value) AS (
  VALUES
    ('signup_application_consents_application_idx'),
    ('signup_application_consents_active_type_unique')
),
name_conflicts AS (
  SELECT
    planned_names.name_value,
    pg_class.relkind
  FROM planned_names
  JOIN pg_class
    ON pg_class.relname = planned_names.name_value
   AND pg_class.relnamespace = 'public'::regnamespace
)
SELECT
  'planned_name' AS section,
  name_value AS item,
  'conflict' AS status,
  relkind::text AS detail
FROM name_conflicts;

WITH function_presence AS (
  SELECT pg_proc.oid
  FROM pg_proc
  JOIN pg_namespace
    ON pg_namespace.oid = pg_proc.pronamespace
  WHERE pg_namespace.nspname = 'public'
    AND pg_proc.proname = 'gen_random_uuid'
    AND pg_get_function_arguments(pg_proc.oid) = ''
    AND pg_get_function_result(pg_proc.oid) = 'uuid'
)
SELECT
  'function' AS section,
  'public.gen_random_uuid()' AS item,
  'missing_or_wrong_signature' AS status,
  'zero-arg uuid return required' AS detail
WHERE NOT EXISTS (SELECT 1 FROM function_presence);

WITH id_column AS (
  SELECT information_schema.columns.data_type
  FROM information_schema.columns
  WHERE columns.table_schema = 'public'
    AND columns.table_name = 'signup_applications'
    AND columns.column_name = 'id'
)
SELECT
  'fk_compatibility' AS section,
  'signup_applications.id' AS item,
  'missing_or_type_drift' AS status,
  COALESCE((SELECT data_type FROM id_column), 'missing') AS detail
WHERE COALESCE((SELECT data_type FROM id_column), '') <> 'text';
