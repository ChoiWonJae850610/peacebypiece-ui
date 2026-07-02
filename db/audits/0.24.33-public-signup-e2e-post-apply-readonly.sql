WITH expected_table(name) AS (
  VALUES
    ('signup_payment_method_references')
)
SELECT
  'public_signup_e2e_table_missing' AS finding,
  expected_table.name AS table_name
FROM expected_table
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.tables existing
  WHERE existing.table_schema = 'public'
    AND existing.table_name = expected_table.name
);

WITH expected_column(name) AS (
  VALUES
    ('id'),
    ('application_id'),
    ('provider_code'),
    ('provider_customer_reference'),
    ('payment_method_reference'),
    ('masked_display'),
    ('brand'),
    ('readiness_state'),
    ('verified_at'),
    ('revoked_at'),
    ('is_simulator'),
    ('environment'),
    ('created_by_system_user_id'),
    ('revoked_by_system_user_id'),
    ('idempotency_key'),
    ('created_at'),
    ('updated_at')
)
SELECT
  'public_signup_e2e_column_missing' AS finding,
  expected_column.name AS column_name
FROM expected_column
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.columns column_info
  WHERE column_info.table_schema = 'public'
    AND column_info.table_name = 'signup_payment_method_references'
    AND column_info.column_name = expected_column.name
);

WITH expected_index(name) AS (
  VALUES
    ('signup_payment_method_references_idempotency_unique'),
    ('signup_payment_method_references_application_active_idx')
)
SELECT
  'public_signup_e2e_index_missing' AS finding,
  expected_index.name AS index_name
FROM expected_index
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_indexes index_info
  WHERE index_info.schemaname = 'public'
    AND index_info.indexname = expected_index.name
);

WITH expected_constraint(name) AS (
  VALUES
    ('signup_payment_method_references_provider_check'),
    ('signup_payment_method_references_readiness_check'),
    ('signup_payment_method_references_environment_check'),
    ('signup_payment_method_references_no_fake_production_ready_check'),
    ('signup_payment_method_references_no_raw_card_check')
)
SELECT
  'public_signup_e2e_constraint_missing' AS finding,
  expected_constraint.name AS constraint_name
FROM expected_constraint
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_constraint constraint_info
  JOIN pg_class table_info ON table_info.oid = constraint_info.conrelid
  JOIN pg_namespace namespace_info ON namespace_info.oid = table_info.relnamespace
  WHERE namespace_info.nspname = 'public'
    AND table_info.relname = 'signup_payment_method_references'
    AND constraint_info.conname = expected_constraint.name
);
