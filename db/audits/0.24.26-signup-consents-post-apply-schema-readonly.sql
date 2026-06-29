WITH expected_tables(table_name) AS (
  VALUES
    ('signup_application_consents')
),
table_presence AS (
  SELECT
    expected_tables.table_name,
    pg_class.relkind
  FROM expected_tables
  LEFT JOIN pg_class
    ON pg_class.relname = expected_tables.table_name
   AND pg_class.relnamespace = 'public'::regnamespace
)
SELECT
  'table' AS section,
  table_name AS item,
  CASE
    WHEN relkind IS NULL THEN 'missing'
    WHEN relkind NOT IN ('r', 'p') THEN 'wrong_relation_kind'
    ELSE 'present'
  END AS status,
  COALESCE(relkind::text, 'missing') AS detail
FROM table_presence
WHERE relkind IS NULL OR relkind NOT IN ('r', 'p');

WITH expected_columns(column_name, data_type) AS (
  VALUES
    ('id', 'text'),
    ('application_id', 'text'),
    ('consent_type', 'text'),
    ('policy_code', 'text'),
    ('policy_version', 'text'),
    ('agreed_at', 'timestamp with time zone'),
    ('agreed_email_normalized', 'text'),
    ('agreed_google_sub', 'text'),
    ('revoked_at', 'timestamp with time zone'),
    ('revoke_reason_code', 'text')
),
column_presence AS (
  SELECT
    expected_columns.column_name,
    expected_columns.data_type AS expected_data_type,
    information_schema.columns.data_type AS actual_data_type
  FROM expected_columns
  LEFT JOIN information_schema.columns
    ON columns.table_schema = 'public'
   AND columns.table_name = 'signup_application_consents'
   AND columns.column_name = expected_columns.column_name
)
SELECT
  'column' AS section,
  'signup_application_consents.' || column_name AS item,
  CASE
    WHEN actual_data_type IS NULL THEN 'missing'
    WHEN actual_data_type <> expected_data_type THEN 'type_drift'
    ELSE 'present'
  END AS status,
  COALESCE(actual_data_type, 'missing') AS detail
FROM column_presence
WHERE actual_data_type IS DISTINCT FROM expected_data_type;

WITH expected_constraints(constraint_name, constraint_type) AS (
  VALUES
    ('signup_application_consents_application_id_fkey', 'f'),
    ('signup_application_consents_type_check', 'c'),
    ('signup_application_consents_policy_code_check', 'c'),
    ('signup_application_consents_policy_version_check', 'c'),
    ('signup_application_consents_email_normalized_check', 'c'),
    ('signup_application_consents_google_sub_check', 'c'),
    ('signup_application_consents_revoke_check', 'c')
),
constraint_presence AS (
  SELECT
    expected_constraints.constraint_name,
    expected_constraints.constraint_type,
    pg_constraint.contype
  FROM expected_constraints
  LEFT JOIN pg_constraint
    ON pg_constraint.conname = expected_constraints.constraint_name
   AND pg_constraint.connamespace = 'public'::regnamespace
)
SELECT
  'constraint' AS section,
  constraint_name AS item,
  CASE
    WHEN contype IS NULL THEN 'missing'
    WHEN contype <> constraint_type THEN 'wrong_constraint_type'
    ELSE 'present'
  END AS status,
  COALESCE(contype::text, 'missing') AS detail
FROM constraint_presence
WHERE contype IS DISTINCT FROM constraint_type;

WITH expected_indexes(index_name) AS (
  VALUES
    ('signup_application_consents_application_idx'),
    ('signup_application_consents_active_type_unique')
),
index_presence AS (
  SELECT
    expected_indexes.index_name,
    pg_class.relkind
  FROM expected_indexes
  LEFT JOIN pg_class
    ON pg_class.relname = expected_indexes.index_name
   AND pg_class.relnamespace = 'public'::regnamespace
)
SELECT
  'index' AS section,
  index_name AS item,
  CASE
    WHEN relkind IS NULL THEN 'missing'
    WHEN relkind <> 'i' THEN 'wrong_relation_kind'
    ELSE 'present'
  END AS status,
  COALESCE(relkind::text, 'missing') AS detail
FROM index_presence
WHERE relkind IS DISTINCT FROM 'i';

WITH forbidden_indexes(index_name) AS (
  VALUES
    ('signup_application_consents_active_version_unique')
),
forbidden_presence AS (
  SELECT
    forbidden_indexes.index_name,
    pg_class.relkind
  FROM forbidden_indexes
  JOIN pg_class
    ON pg_class.relname = forbidden_indexes.index_name
   AND pg_class.relnamespace = 'public'::regnamespace
)
SELECT
  'forbidden_index' AS section,
  index_name AS item,
  'unexpected_present' AS status,
  relkind::text AS detail
FROM forbidden_presence;
