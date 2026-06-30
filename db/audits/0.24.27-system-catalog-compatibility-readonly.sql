WITH planned_names(name) AS (
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
SELECT 'planned_relation_exists' AS finding, name
FROM planned_names
WHERE to_regclass('public.' || name) IS NOT NULL
UNION ALL
SELECT 'required_companies_missing' AS finding, 'companies'
WHERE to_regclass('public.companies') IS NULL;
