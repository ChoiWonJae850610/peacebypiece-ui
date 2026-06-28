WITH public_namespace AS (
  SELECT oid
  FROM pg_namespace
  WHERE nspname = 'public'
),
expected_tables(table_name) AS (
  VALUES
    ('system_users'),
    ('companies'),
    ('users'),
    ('company_members'),
    ('company_subscriptions'),
    ('company_files')
),
table_presence AS (
  SELECT
    expected_tables.table_name,
    CASE
      WHEN public_relation.oid IS NULL THEN 'missing_table'
      WHEN public_relation.relkind NOT IN ('r', 'p') THEN 'not_table'
      ELSE 'present'
    END AS status,
    public_relation.relkind
  FROM expected_tables
  CROSS JOIN public_namespace
  LEFT JOIN pg_class public_relation
    ON public_relation.relnamespace = public_namespace.oid
   AND public_relation.relname = expected_tables.table_name
)
SELECT
  'required_table' AS section,
  table_name AS item,
  status,
  relkind::text AS detail
FROM table_presence
WHERE status <> 'present';

WITH public_namespace AS (
  SELECT oid
  FROM pg_namespace
  WHERE nspname = 'public'
),
expected_id_columns(table_name) AS (
  VALUES
    ('system_users'),
    ('companies'),
    ('users'),
    ('company_members'),
    ('company_subscriptions'),
    ('company_files')
),
public_tables AS (
  SELECT
    expected_id_columns.table_name,
    public_relation.oid AS relation_oid,
    public_relation.relkind
  FROM expected_id_columns
  CROSS JOIN public_namespace
  LEFT JOIN pg_class public_relation
    ON public_relation.relnamespace = public_namespace.oid
   AND public_relation.relname = expected_id_columns.table_name
),
id_column_presence AS (
  SELECT
    public_tables.table_name,
    public_tables.relation_oid,
    public_tables.relkind,
    columns.data_type,
    columns.udt_name
  FROM public_tables
  LEFT JOIN information_schema.columns columns
    ON columns.table_schema = 'public'
   AND columns.table_name = public_tables.table_name
   AND columns.column_name = 'id'
)
SELECT
  'id_column' AS section,
  table_name AS item,
  CASE
    WHEN relation_oid IS NULL THEN 'missing_table'
    WHEN relkind NOT IN ('r', 'p') THEN 'not_table'
    WHEN data_type IS NULL THEN 'missing_id_column'
    WHEN data_type <> 'text' THEN 'id_type_drift'
    ELSE 'compatible'
  END AS status,
  COALESCE(data_type || '/' || udt_name, 'missing') AS detail
FROM id_column_presence
WHERE relation_oid IS NULL
   OR relkind NOT IN ('r', 'p')
   OR data_type IS DISTINCT FROM 'text';

WITH function_presence AS (
  SELECT
    COUNT(*) AS match_count,
    COUNT(*) FILTER (
      WHERE pg_get_function_result(pg_proc.oid) = 'uuid'
        AND pg_proc.pronargs = 0
    ) AS callable_uuid_count
  FROM pg_proc
  JOIN pg_namespace
    ON pg_namespace.oid = pg_proc.pronamespace
  WHERE pg_proc.proname = 'gen_random_uuid'
)
SELECT
  'function' AS section,
  'gen_random_uuid' AS item,
  CASE WHEN callable_uuid_count > 0 THEN 'compatible' ELSE 'missing_or_incompatible' END AS status,
  ('matches=' || match_count::text || ', callable_uuid=' || callable_uuid_count::text) AS detail
FROM function_presence
WHERE callable_uuid_count = 0;

WITH public_namespace AS (
  SELECT oid
  FROM pg_namespace
  WHERE nspname = 'public'
),
future_relations(relation_name) AS (
  VALUES
    ('signup_applications'),
    ('signup_application_files')
),
future_presence AS (
  SELECT
    future_relations.relation_name,
    public_relation.relkind
  FROM future_relations
  CROSS JOIN public_namespace
  LEFT JOIN pg_class public_relation
    ON public_relation.relnamespace = public_namespace.oid
   AND public_relation.relname = future_relations.relation_name
)
SELECT
  'future_relation' AS section,
  relation_name AS item,
  CASE WHEN relkind IS NULL THEN 'available' ELSE 'already_exists' END AS status,
  relkind::text AS detail
FROM future_presence
WHERE relkind IS NOT NULL;

WITH public_namespace AS (
  SELECT oid
  FROM pg_namespace
  WHERE nspname = 'public'
),
planned_names(name_value) AS (
  VALUES
    ('signup_applications_review_queue_idx'),
    ('signup_applications_correction_due_idx'),
    ('signup_applications_active_email_idx'),
    ('signup_applications_active_google_sub_idx'),
    ('signup_applications_active_business_registration_idx'),
    ('signup_applications_created_company_idx'),
    ('signup_applications_created_user_idx'),
    ('signup_applications_created_member_idx'),
    ('signup_applications_created_subscription_idx'),
    ('signup_application_files_application_type_active_idx'),
    ('signup_application_files_storage_key_unique'),
    ('signup_application_files_active_certificate_unique')
),
name_conflicts AS (
  SELECT
    planned_names.name_value,
    public_relation.relkind
  FROM planned_names
  CROSS JOIN public_namespace
  JOIN pg_class public_relation
    ON public_relation.relnamespace = public_namespace.oid
   AND public_relation.relname = planned_names.name_value
)
SELECT
  'planned_name' AS section,
  name_value AS item,
  'conflict' AS status,
  relkind::text AS detail
FROM name_conflicts;
