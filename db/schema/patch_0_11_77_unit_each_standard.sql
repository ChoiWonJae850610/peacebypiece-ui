INSERT INTO system_unit_standards (id, code, korean_name, english_code, category, description, example_label, is_active, sort_order)
VALUES
  ('system-unit-each', 'each', '개', 'ea', 'count', '부자재 개수 단위', '단추 100개', true, 15)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    korean_name = EXCLUDED.korean_name,
    english_code = EXCLUDED.english_code,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    example_label = EXCLUDED.example_label,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO company_enabled_unit_standards (company_id, unit_standard_id, is_enabled, sort_order)
SELECT c.id, 'system-unit-each', true, 15
FROM companies c
ON CONFLICT (company_id, unit_standard_id) DO UPDATE
SET is_enabled = EXCLUDED.is_enabled,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
