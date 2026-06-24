-- WAFL 0.24.21.11 READ-ONLY RECONCILIATION QUERIES
-- DO NOT run against production without explicit approval.
-- Every statement is SELECT-only and is intended for a safe dev/test copy.

-- 1. users authority differs from membership tables
SELECT u.id AS user_id, u.company_id AS users_company_id, u.role AS users_role,
       cu.company_id AS company_users_company_id, cu.role AS company_users_role,
       cm.company_id AS company_members_company_id, cm.role_template_code, cm.status
FROM users u
LEFT JOIN company_users cu ON cu.user_id = u.id AND cu.is_active = true
LEFT JOIN company_members cm ON cm.user_id = u.id AND cm.status = 'approved'
WHERE (cu.company_id IS NOT NULL AND cu.company_id <> u.company_id)
   OR (cm.company_id IS NOT NULL AND cm.company_id <> u.company_id)
   OR (cu.role IS NOT NULL AND cu.role <> u.role);

-- 2. one user approved in multiple companies
SELECT user_id, COUNT(DISTINCT company_id) AS company_count, array_agg(DISTINCT company_id) AS company_ids
FROM company_members
WHERE status = 'approved'
GROUP BY user_id
HAVING COUNT(DISTINCT company_id) > 1;

-- 3. duplicate/competing active company_users rows
SELECT company_id, user_id, COUNT(*) AS row_count, array_agg(role ORDER BY role) AS roles
FROM company_users
WHERE is_active = true
GROUP BY company_id, user_id
HAVING COUNT(*) > 1;

-- 4. subscription data drift
SELECT c.id AS company_id,
       c.requested_plan_code, c.default_plan_id, c.billing_status, c.subscription_status,
       c.storage_limit_bytes, c.member_limit,
       s.plan_code, s.status AS subscription_row_status,
       s.storage_limit_bytes AS subscription_storage_limit_bytes,
       s.member_limit AS subscription_member_limit,
       a.plan_id AS active_assignment_plan_id,
       p.code AS active_assignment_plan_code
FROM companies c
LEFT JOIN company_subscriptions s ON s.company_id = c.id
LEFT JOIN company_plan_assignments a ON a.company_id = c.id AND a.status = 'active'
LEFT JOIN plans p ON p.id = a.plan_id
WHERE (s.plan_code IS NOT NULL AND c.requested_plan_code IS NOT NULL AND s.plan_code <> c.requested_plan_code)
   OR (s.storage_limit_bytes IS NOT NULL AND c.storage_limit_bytes IS NOT NULL AND s.storage_limit_bytes <> c.storage_limit_bytes)
   OR (s.member_limit IS NOT NULL AND c.member_limit IS NOT NULL AND s.member_limit <> c.member_limit)
   OR (p.code IS NOT NULL AND s.plan_code IS NOT NULL AND p.code <> s.plan_code);

-- 5. orphan tenant references for major tables
SELECT 'spec_sheets' AS source, s.id AS row_id, s.company_id
FROM spec_sheets s LEFT JOIN companies c ON c.id = s.company_id WHERE c.id IS NULL
UNION ALL
SELECT 'attachments', a.id, a.company_id
FROM attachments a LEFT JOIN companies c ON c.id = a.company_id WHERE c.id IS NULL
UNION ALL
SELECT 'attachment_trash_items', t.id, t.company_id
FROM attachment_trash_items t LEFT JOIN companies c ON c.id = t.company_id WHERE c.id IS NULL;

-- 6. attachment/workorder/trash company mismatch
SELECT a.id AS attachment_id, a.company_id AS attachment_company_id,
       s.company_id AS workorder_company_id,
       t.company_id AS trash_company_id
FROM attachments a
JOIN spec_sheets s ON s.id = a.order_id
LEFT JOIN attachment_trash_items t ON t.attachment_id = a.id
WHERE a.company_id <> s.company_id
   OR (t.company_id IS NOT NULL AND t.company_id <> a.company_id)
   OR (t.order_id IS NOT NULL AND t.order_id <> a.order_id);

-- 7. conflicting attachment and trash states
SELECT a.id AS attachment_id, a.is_active, a.deleted_at,
       t.id AS trash_id, t.purge_status, t.restored_at, t.purged_at
FROM attachments a
JOIN attachment_trash_items t ON t.attachment_id = a.id
WHERE (a.deleted_at IS NULL AND a.is_active = true AND t.restored_at IS NULL AND t.purged_at IS NULL)
   OR (t.purged_at IS NOT NULL AND (a.deleted_at IS NULL OR a.is_active = true));

-- 8. duplicate active generated final documents
SELECT company_id, order_id, generated_document_type, COUNT(*) AS active_count,
       array_agg(id ORDER BY created_at DESC) AS attachment_ids
FROM attachments
WHERE source_type = 'system'
  AND generated_document_type IS NOT NULL
  AND deleted_at IS NULL
  AND COALESCE(is_active, true) = true
GROUP BY company_id, order_id, generated_document_type
HAVING COUNT(*) > 1;

-- 9. invalid text dates requiring cleanup before type migration
SELECT id, due_date
FROM spec_sheets
WHERE due_date IS NOT NULL
  AND btrim(due_date) <> ''
  AND due_date !~ '^\d{4}-\d{2}-\d{2}$';

-- 10. missing live actor references that require classification, not blind FK creation
SELECT id, manager_id, created_by_id, purge_requested_by, purged_by
FROM spec_sheets
WHERE (manager_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = spec_sheets.manager_id))
   OR (created_by_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = spec_sheets.created_by_id));
