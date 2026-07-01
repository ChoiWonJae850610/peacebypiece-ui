WITH expected(name) AS (
  VALUES
    ('company_billing_customers'),
    ('company_payment_method_references'),
    ('billing_subscription_states'),
    ('billing_cycles'),
    ('billing_invoices'),
    ('billing_invoice_lines'),
    ('billing_payment_attempts'),
    ('billing_transactions'),
    ('billing_refunds'),
    ('billing_subscription_changes'),
    ('billing_events'),
    ('billing_retry_schedules'),
    ('billing_webhook_events'),
    ('billing_notification_outbox'),
    ('company_export_jobs'),
    ('company_export_parts'),
    ('company_termination_records'),
    ('company_recovery_actions')
)
SELECT
  'billing_table_missing' AS finding,
  expected.name AS table_name
FROM expected
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.tables existing
  WHERE existing.table_schema = 'public'
    AND existing.table_name = expected.name
);

WITH expected_index(name) AS (
  VALUES
    ('company_payment_method_references_idempotency_unique'),
    ('billing_subscription_states_company_unique'),
    ('billing_invoices_idempotency_unique'),
    ('billing_payment_attempts_invoice_retry_unique'),
    ('billing_retry_schedules_invoice_day_unique'),
    ('billing_notification_outbox_idempotency_unique'),
    ('company_export_jobs_idempotency_unique'),
    ('company_export_parts_storage_key_unique'),
    ('company_termination_records_idempotency_unique')
)
SELECT
  'billing_index_missing' AS finding,
  expected_index.name AS index_name
FROM expected_index
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_indexes index_info
  WHERE index_info.schemaname = 'public'
    AND index_info.indexname = expected_index.name
);
