-- WAFL 0.24.21.12 CONSTRAINT READINESS - READ ONLY
SELECT 'company_members_multiple_approved_companies' AS check_name, COUNT(*) AS issue_count
FROM (
  SELECT user_id FROM company_members WHERE status = 'approved' GROUP BY user_id HAVING COUNT(DISTINCT company_id) > 1
) x
UNION ALL
SELECT 'company_users_duplicate_active', COUNT(*)
FROM (
  SELECT company_id, user_id FROM company_users WHERE is_active = true GROUP BY company_id, user_id HAVING COUNT(*) > 1
) x
UNION ALL
SELECT 'attachments_orphan_company', COUNT(*)
FROM attachments a LEFT JOIN companies c ON c.id = a.company_id WHERE c.id IS NULL
UNION ALL
SELECT 'spec_sheets_orphan_company', COUNT(*)
FROM spec_sheets s LEFT JOIN companies c ON c.id = s.company_id WHERE c.id IS NULL
UNION ALL
SELECT 'duplicate_active_final_pdf', COUNT(*)
FROM (
  SELECT company_id, order_id, generated_document_type
  FROM attachments
  WHERE source_type = 'system' AND generated_document_type IS NOT NULL AND deleted_at IS NULL AND COALESCE(is_active, true) = true
  GROUP BY company_id, order_id, generated_document_type HAVING COUNT(*) > 1
) x;
