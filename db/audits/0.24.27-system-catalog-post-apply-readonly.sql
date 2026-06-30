WITH required_relations(name) AS (
  VALUES
    ('system_catalog_versions'),
    ('system_catalog_categories'),
    ('company_catalog_categories'),
    ('system_size_sets'),
    ('system_size_options'),
    ('system_category_size_sets'),
    ('company_size_set_activations'),
    ('system_pom_definitions'),
    ('system_category_poms'),
    ('company_pom_activations'),
    ('company_catalog_provisioning')
)
SELECT 'missing_relation' AS finding, name
FROM required_relations
WHERE to_regclass('public.' || name) IS NULL
UNION ALL
SELECT 'missing_current_catalog_version' AS finding, 'system_catalog_versions'
WHERE to_regclass('public.system_catalog_versions') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM system_catalog_versions
    WHERE code = 'wafl-system-catalog-2026-0.24.27' AND is_current = true
  )
UNION ALL
SELECT 'no_system_categories' AS finding, 'system_catalog_categories'
WHERE to_regclass('public.system_catalog_categories') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM system_catalog_categories)
UNION ALL
SELECT 'underwear_not_default_inactive' AS finding, code
FROM system_catalog_categories
WHERE to_regclass('public.system_catalog_categories') IS NOT NULL
  AND domain = 'underwear'
  AND default_enabled IS DISTINCT FROM false
UNION ALL
SELECT 'accessory_not_default_inactive' AS finding, code
FROM system_catalog_categories
WHERE to_regclass('public.system_catalog_categories') IS NOT NULL
  AND domain = 'accessory'
  AND default_enabled IS DISTINCT FROM false;
