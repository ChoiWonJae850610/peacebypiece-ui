WITH expected_tables(table_name) AS (
  VALUES
    ('signup_applications'),
    ('signup_application_files')
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

WITH expected_columns(table_name, column_name, data_type) AS (
  VALUES
    ('signup_applications', 'id', 'text'),
    ('signup_application_files', 'id', 'text')
),
column_presence AS (
  SELECT
    expected_columns.table_name,
    expected_columns.column_name,
    expected_columns.data_type AS expected_data_type,
    information_schema.columns.data_type AS actual_data_type
  FROM expected_columns
  LEFT JOIN information_schema.columns
    ON columns.table_schema = 'public'
   AND columns.table_name = expected_columns.table_name
   AND columns.column_name = expected_columns.column_name
)
SELECT
  'column' AS section,
  table_name || '.' || column_name AS item,
  CASE
    WHEN actual_data_type IS NULL THEN 'missing'
    WHEN actual_data_type <> expected_data_type THEN 'type_drift'
    ELSE 'present'
  END AS status,
  COALESCE(actual_data_type, 'missing') AS detail
FROM column_presence
WHERE actual_data_type IS DISTINCT FROM expected_data_type;

WITH expected_foreign_keys(constraint_name) AS (
  VALUES
    ('signup_application_files_application_id_fkey'),
    ('signup_applications_reviewed_by_system_user_id_fkey'),
    ('signup_applications_created_company_id_fkey'),
    ('signup_applications_created_user_id_fkey'),
    ('signup_applications_created_company_member_id_fkey'),
    ('signup_applications_created_subscription_id_fkey'),
    ('signup_application_files_reviewed_by_system_user_id_fkey'),
    ('signup_application_files_approved_company_file_id_fkey')
),
fk_presence AS (
  SELECT
    expected_foreign_keys.constraint_name,
    pg_constraint.contype
  FROM expected_foreign_keys
  LEFT JOIN pg_constraint
    ON pg_constraint.conname = expected_foreign_keys.constraint_name
   AND pg_constraint.connamespace = 'public'::regnamespace
)
SELECT
  'foreign_key' AS section,
  constraint_name AS item,
  CASE
    WHEN contype IS NULL THEN 'missing'
    WHEN contype <> 'f' THEN 'wrong_constraint_type'
    ELSE 'present'
  END AS status,
  COALESCE(contype::text, 'missing') AS detail
FROM fk_presence
WHERE contype IS DISTINCT FROM 'f';

WITH expected_checks(constraint_name) AS (
  VALUES
    ('signup_applications_status_check'),
    ('signup_applications_plan_code_check'),
    ('signup_applications_email_verified_check'),
    ('signup_applications_email_normalized_check'),
    ('signup_applications_required_identity_check'),
    ('signup_applications_business_registration_check'),
    ('signup_applications_business_validation_status_check'),
    ('signup_applications_provisioning_status_check'),
    ('signup_applications_status_provisioning_consistency_check'),
    ('signup_applications_submitted_timestamp_check'),
    ('signup_applications_correction_check'),
    ('signup_applications_approved_check'),
    ('signup_applications_rejected_check'),
    ('signup_applications_canceled_check'),
    ('signup_applications_provisioning_failed_check'),
    ('signup_application_files_type_check'),
    ('signup_application_files_size_check'),
    ('signup_application_files_original_name_check'),
    ('signup_application_files_storage_key_check'),
    ('signup_application_files_mime_type_check')
),
check_presence AS (
  SELECT
    expected_checks.constraint_name,
    pg_constraint.contype
  FROM expected_checks
  LEFT JOIN pg_constraint
    ON pg_constraint.conname = expected_checks.constraint_name
   AND pg_constraint.connamespace = 'public'::regnamespace
)
SELECT
  'check_constraint' AS section,
  constraint_name AS item,
  CASE
    WHEN contype IS NULL THEN 'missing'
    WHEN contype <> 'c' THEN 'wrong_constraint_type'
    ELSE 'present'
  END AS status,
  COALESCE(contype::text, 'missing') AS detail
FROM check_presence
WHERE contype IS DISTINCT FROM 'c';

WITH expected_indexes(index_name) AS (
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

SELECT
  'smoke_residue' AS section,
  'signup-smoke-%' AS item,
  'unexpected_row_residue' AS status,
  count(*)::text AS detail
FROM signup_applications
WHERE id LIKE 'signup-smoke-%'
HAVING count(*) > 0;
