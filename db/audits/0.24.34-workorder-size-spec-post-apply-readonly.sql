WITH required_relations AS (
  SELECT name
  FROM (VALUES
    ('public.workorder_size_specs'),
    ('public.workorder_size_spec_sizes'),
    ('public.workorder_size_spec_poms'),
    ('public.workorder_size_spec_values')
  ) AS required(name)
  WHERE to_regclass(required.name) IS NULL
),
required_columns AS (
  SELECT table_name, column_name
  FROM (VALUES
    ('workorder_size_specs', 'work_order_id'),
    ('workorder_size_specs', 'company_id'),
    ('workorder_size_specs', 'size_set_code'),
    ('workorder_size_specs', 'measurement_unit'),
    ('workorder_size_spec_sizes', 'size_code'),
    ('workorder_size_spec_poms', 'pom_code'),
    ('workorder_size_spec_values', 'display_value'),
    ('workorder_size_spec_values', 'decimal_value')
  ) AS required(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = required.table_name
      AND c.column_name = required.column_name
  )
),
required_indexes AS (
  SELECT index_name
  FROM (VALUES
    ('workorder_size_specs_company_idx'),
    ('workorder_size_spec_sizes_company_idx'),
    ('workorder_size_spec_poms_company_idx'),
    ('workorder_size_spec_values_lookup_idx')
  ) AS required(index_name)
  WHERE to_regclass('public.' || required.index_name) IS NULL
)
SELECT 'required_relation_missing' AS finding, name AS detail
FROM required_relations
UNION ALL
SELECT 'required_column_missing' AS finding, table_name || '.' || column_name AS detail
FROM required_columns
UNION ALL
SELECT 'required_index_missing' AS finding, index_name AS detail
FROM required_indexes;
