WITH planned_relation(name) AS (
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
  'planned_relation_name_conflict' AS finding,
  planned_relation.name AS relation_name
FROM planned_relation
JOIN information_schema.tables existing
  ON existing.table_schema = 'public'
 AND existing.table_name = planned_relation.name
WHERE existing.table_type <> 'BASE TABLE';

WITH required_relation(name) AS (
  VALUES
    ('companies'),
    ('users'),
    ('company_subscriptions'),
    ('signup_applications')
)
SELECT
  'required_relation_missing' AS finding,
  required_relation.name AS relation_name
FROM required_relation
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.tables existing
  WHERE existing.table_schema = 'public'
    AND existing.table_name = required_relation.name
);
