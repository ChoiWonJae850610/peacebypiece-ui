WITH planned_relation(name) AS (
  VALUES
    ('signup_payment_method_references')
)
SELECT
  'planned_relation_name_conflict' AS finding,
  planned_relation.name AS relation_name,
  existing.table_type AS existing_type
FROM planned_relation
JOIN information_schema.tables existing
  ON existing.table_schema = 'public'
 AND existing.table_name = planned_relation.name
WHERE existing.table_type <> 'BASE TABLE';

WITH required_relation(name) AS (
  VALUES
    ('signup_applications'),
    ('system_users'),
    ('company_payment_method_references'),
    ('billing_notification_outbox')
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

WITH planned_index(name) AS (
  VALUES
    ('signup_payment_method_references_idempotency_unique'),
    ('signup_payment_method_references_application_active_idx')
)
SELECT
  'planned_index_name_conflict' AS finding,
  planned_index.name AS index_name
FROM planned_index
JOIN pg_class relation ON relation.relname = planned_index.name
JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
WHERE namespace.nspname = 'public'
  AND relation.relkind <> 'i';
