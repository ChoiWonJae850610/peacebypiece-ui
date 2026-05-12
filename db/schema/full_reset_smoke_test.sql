-- =========================================
-- PeaceByPiece full_reset smoke test
-- Version: 0.10.77
--
-- 목적:
-- - full_reset.sql 실행 후 핵심 테이블 / view / seed / 제약 구조가 만들어졌는지 확인한다.
-- - 운영 DB가 아니라 개발 DB에서 full_reset.sql 실행 직후 검증용으로 사용한다.
--
-- 사용 순서:
-- 1) db/schema/full_reset.sql 실행
-- 2) db/schema/full_reset_smoke_test.sql 실행
--
-- 주의:
-- - 이 파일은 데이터를 삭제하지 않는다.
-- - 검증 실패 시 RAISE EXCEPTION으로 중단한다.
-- =========================================

DO $$
DECLARE
  missing_items text[];
BEGIN
  SELECT array_agg(item_name)
  INTO missing_items
  FROM (
    VALUES
      ('companies', to_regclass('public.companies')),
      ('users', to_regclass('public.users')),
      ('company_users', to_regclass('public.company_users')),
      ('role_catalog', to_regclass('public.role_catalog')),
      ('permission_catalog', to_regclass('public.permission_catalog')),
      ('role_permissions', to_regclass('public.role_permissions')),
      ('company_user_permissions', to_regclass('public.company_user_permissions')),
      ('company_members', to_regclass('public.company_members')),
      ('member_permissions', to_regclass('public.member_permissions')),
      ('role_templates', to_regclass('public.role_templates')),
      ('role_template_permissions', to_regclass('public.role_template_permissions')),
      ('join_requests', to_regclass('public.join_requests')),
      ('system_users', to_regclass('public.system_users')),
      ('system_permission_catalog', to_regclass('public.system_permission_catalog')),
      ('system_user_permissions', to_regclass('public.system_user_permissions')),
      ('system_unit_standards', to_regclass('public.system_unit_standards')),
      ('company_enabled_unit_standards', to_regclass('public.company_enabled_unit_standards')),
      ('system_outsourcing_process_standards', to_regclass('public.system_outsourcing_process_standards')),
      ('company_enabled_process_standards', to_regclass('public.company_enabled_process_standards')),
      ('system_product_type_templates', to_regclass('public.system_product_type_templates')),
      ('system_product_type_template_categories', to_regclass('public.system_product_type_template_categories')),
      ('invitations', to_regclass('public.invitations')),
      ('plans', to_regclass('public.plans')),
      ('company_plan_assignments', to_regclass('public.company_plan_assignments')),
      ('storage_usage_snapshots', to_regclass('public.storage_usage_snapshots')),
      ('company_workorder_daily_stats', to_regclass('public.company_workorder_daily_stats')),
      ('company_workorder_monthly_stats', to_regclass('public.company_workorder_monthly_stats')),
      ('company_storage_daily_stats', to_regclass('public.company_storage_daily_stats')),
      ('expired_pending_invitations', to_regclass('public.expired_pending_invitations')),
      ('latest_storage_usage_snapshots', to_regclass('public.latest_storage_usage_snapshots')),
      ('spec_sheets', to_regclass('public.spec_sheets')),
      ('orders', to_regclass('public.orders')),
      ('attachments', to_regclass('public.attachments')),
      ('memos', to_regclass('public.memos')),
      ('audit_logs', to_regclass('public.audit_logs')),
      ('history_logs', to_regclass('public.history_logs')),
      ('partners', to_regclass('public.partners')),
      ('partner_items', to_regclass('public.partner_items')),
      ('material_orders', to_regclass('public.material_orders')),
      ('material_order_lines', to_regclass('public.material_order_lines')),
      ('material_allocations', to_regclass('public.material_allocations'))
  ) AS required_items(item_name, regclass_value)
  WHERE regclass_value IS NULL;

  IF missing_items IS NOT NULL THEN
    RAISE EXCEPTION 'full_reset smoke test failed. Missing tables/views: %', missing_items;
  END IF;
END $$;


DO $$
DECLARE
  missing_columns text[];
BEGIN
  SELECT array_agg(table_name || '.' || column_name)
  INTO missing_columns
  FROM (
    VALUES
      ('spec_sheets', 'delete_status'),
      ('spec_sheets', 'purge_status'),
      ('spec_sheets', 'purge_requested_at'),
      ('spec_sheets', 'purged_at'),
      ('spec_sheets', 'purged_by'),
      ('spec_sheets', 'purge_requested_by'),
      ('spec_sheets', 'delete_source'),
      ('spec_sheets', 'delete_scope'),
      ('spec_sheets', 'delete_parent_type'),
      ('spec_sheets', 'delete_parent_id'),
      ('spec_sheets', 'delete_batch_id'),
      ('spec_sheets', 'category1_id'),
      ('spec_sheets', 'category2_id'),
      ('spec_sheets', 'category3_id'),
      ('company_workorder_daily_stats', 'stats_date'),
      ('company_workorder_daily_stats', 'created_workorder_count'),
      ('company_workorder_daily_stats', 'reorder_workorder_count'),
      ('company_workorder_monthly_stats', 'stats_month'),
      ('company_workorder_monthly_stats', 'order_quantity_total'),
      ('company_storage_daily_stats', 'stats_date'),
      ('company_storage_daily_stats', 'active_attachment_bytes'),
      ('company_storage_daily_stats', 'purge_requested_count'),
      ('memos', 'delete_status'),
      ('memos', 'purge_status'),
      ('memos', 'purge_requested_at'),
      ('memos', 'purged_at'),
      ('memos', 'purged_by'),
      ('memos', 'purge_requested_by'),
      ('memos', 'delete_source'),
      ('memos', 'delete_scope'),
      ('memos', 'delete_parent_type'),
      ('memos', 'delete_parent_id'),
      ('memos', 'delete_batch_id'),
      ('attachments', 'delete_source'),
      ('attachments', 'delete_scope'),
      ('attachments', 'delete_parent_type'),
      ('attachments', 'delete_parent_id'),
      ('attachments', 'delete_batch_id'),
      ('attachment_trash_items', 'delete_source'),
      ('attachment_trash_items', 'delete_scope'),
      ('attachment_trash_items', 'delete_parent_type'),
      ('attachment_trash_items', 'delete_parent_id'),
      ('attachment_trash_items', 'delete_batch_id'),
      ('attachment_trash_items', 'purge_requested_by'),
      ('attachment_trash_items', 'purge_failure_code'),
      ('audit_logs', 'actor_role'),
      ('audit_logs', 'company_id'),
      ('audit_logs', 'target_type'),
      ('audit_logs', 'target_id'),
      ('audit_logs', 'event_type'),
      ('audit_logs', 'severity'),
      ('audit_logs', 'summary'),
      ('audit_logs', 'metadata'),
      ('audit_logs', 'request_id'),
      ('audit_logs', 'ip_address'),
      ('system_unit_standards', 'korean_name'),
      ('system_unit_standards', 'english_code'),
      ('company_enabled_unit_standards', 'is_enabled'),
      ('system_outsourcing_process_standards', 'name'),
      ('system_outsourcing_process_standards', 'category'),
      ('company_enabled_process_standards', 'is_enabled'),
      ('system_product_type_templates', 'is_default'),
      ('system_product_type_template_categories', 'template_id'),
      ('system_product_type_template_categories', 'parent_id'),
      ('system_product_type_template_categories', 'level'),
      ('users', 'auth_provider'),
      ('users', 'provider_user_id'),
      ('users', 'email_verified'),
      ('users', 'status'),
      ('companies', 'plan_code'),
      ('companies', 'status'),
      ('permission_catalog', 'permission_group'),
      ('permission_catalog', 'label_key'),
      ('permission_catalog', 'description_key'),
      ('permission_catalog', 'is_system_permission'),
      ('permission_catalog', 'sort_order'),
      ('company_members', 'role_template_code'),
      ('member_permissions', 'permission_code'),
      ('role_templates', 'role_code'),
      ('role_template_permissions', 'permission_code'),
      ('invitations', 'invitation_type'),
      ('invitations', 'invited_email'),
      ('invitations', 'target_role_template_code'),
      ('join_requests', 'request_type'),
      ('join_requests', 'created_company_id')
  ) AS required_columns(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
      FROM information_schema.columns c
     WHERE c.table_schema = current_schema()
       AND c.table_name = required_columns.table_name
       AND c.column_name = required_columns.column_name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'full_reset smoke test failed. Missing purge/delete/category columns: %', missing_columns;
  END IF;
END $$;


DO $$
DECLARE
  legacy_columns text[];
BEGIN
  SELECT array_agg(table_name || '.' || column_name)
  INTO legacy_columns
  FROM (
    VALUES
      ('attachments', 'delete_reason'),
      ('attachment_trash_items', 'delete_reason'),
      ('memos', 'delete_reason'),
      ('spec_sheets', 'delete_reason')
  ) AS blocked_columns(table_name, column_name)
  WHERE EXISTS (
    SELECT 1
      FROM information_schema.columns c
     WHERE c.table_schema = current_schema()
       AND c.table_name = blocked_columns.table_name
       AND c.column_name = blocked_columns.column_name
  );

  IF legacy_columns IS NOT NULL THEN
    RAISE EXCEPTION 'full_reset smoke test failed. Legacy delete_reason columns remain: %', legacy_columns;
  END IF;
END $$;

DO $$
DECLARE
  role_count integer;
  permission_count integer;
  plan_count integer;
  company_count integer;
  system_permission_count integer;
  system_unit_standard_count integer;
  system_process_standard_count integer;
  system_product_template_count integer;
  role_template_count integer;
  member_permission_catalog_count integer;
BEGIN
  SELECT count(*) INTO role_count FROM role_catalog;
  SELECT count(*) INTO permission_count FROM permission_catalog;
  SELECT count(*) INTO plan_count FROM plans;
  SELECT count(*) INTO company_count FROM companies;
  SELECT count(*) INTO system_permission_count FROM system_permission_catalog;
  SELECT count(*) INTO system_unit_standard_count FROM system_unit_standards;
  SELECT count(*) INTO system_process_standard_count FROM system_outsourcing_process_standards;
  SELECT count(*) INTO system_product_template_count FROM system_product_type_templates;
  SELECT count(*) INTO role_template_count FROM role_templates WHERE is_system_default = true;
  SELECT count(*) INTO member_permission_catalog_count FROM permission_catalog WHERE permission_group IN ('workorder', 'member', 'storage', 'settings', 'audit');

  IF role_count < 5 THEN
    RAISE EXCEPTION 'role_catalog seed count too low: %', role_count;
  END IF;

  IF permission_count < 30 THEN
    RAISE EXCEPTION 'permission_catalog seed count too low: %', permission_count;
  END IF;

  IF plan_count < 3 THEN
    RAISE EXCEPTION 'plans seed count too low: %', plan_count;
  END IF;

  IF company_count < 1 THEN
    RAISE EXCEPTION 'companies seed missing';
  END IF;

  IF system_permission_count < 7 THEN
    RAISE EXCEPTION 'system_permission_catalog seed count too low: %', system_permission_count;
  END IF;

  IF system_unit_standard_count < 5 THEN
    RAISE EXCEPTION 'system_unit_standards seed count too low: %', system_unit_standard_count;
  END IF;

  IF system_process_standard_count < 5 THEN
    RAISE EXCEPTION 'system_outsourcing_process_standards seed count too low: %', system_process_standard_count;
  END IF;

  IF system_product_template_count < 1 THEN
    RAISE EXCEPTION 'system_product_type_templates seed missing';
  END IF;

  IF role_template_count < 5 THEN
    RAISE EXCEPTION 'role_templates default seed count too low: %', role_template_count;
  END IF;

  IF member_permission_catalog_count < 20 THEN
    RAISE EXCEPTION 'permission_catalog member/access seed count too low: %', member_permission_catalog_count;
  END IF;
END $$;

DO $$
DECLARE
  orphan_role_permissions integer;
  orphan_company_users integer;
  orphan_plan_assignments integer;
  orphan_storage_snapshots integer;
  orphan_company_unit_standards integer;
  orphan_company_process_standards integer;
  orphan_template_categories integer;
BEGIN
  SELECT count(*)
  INTO orphan_role_permissions
  FROM role_permissions rp
  LEFT JOIN role_catalog rc ON rc.role = rp.role
  LEFT JOIN permission_catalog pc ON pc.permission_key = rp.permission_key
  WHERE rc.role IS NULL OR pc.permission_key IS NULL;

  SELECT count(*)
  INTO orphan_company_users
  FROM company_users cu
  LEFT JOIN companies c ON c.id = cu.company_id
  LEFT JOIN users u ON u.id = cu.user_id
  WHERE c.id IS NULL OR u.id IS NULL;

  SELECT count(*)
  INTO orphan_plan_assignments
  FROM company_plan_assignments cpa
  LEFT JOIN companies c ON c.id = cpa.company_id
  LEFT JOIN plans p ON p.id = cpa.plan_id
  WHERE c.id IS NULL OR p.id IS NULL;

  SELECT count(*)
  INTO orphan_storage_snapshots
  FROM storage_usage_snapshots sus
  LEFT JOIN companies c ON c.id = sus.company_id
  WHERE c.id IS NULL;

  SELECT count(*)
  INTO orphan_company_unit_standards
  FROM company_enabled_unit_standards ceus
  LEFT JOIN companies c ON c.id = ceus.company_id
  LEFT JOIN system_unit_standards sus ON sus.id = ceus.unit_standard_id
  WHERE c.id IS NULL OR sus.id IS NULL;

  SELECT count(*)
  INTO orphan_company_process_standards
  FROM company_enabled_process_standards ceps
  LEFT JOIN companies c ON c.id = ceps.company_id
  LEFT JOIN system_outsourcing_process_standards sps ON sps.id = ceps.process_standard_id
  WHERE c.id IS NULL OR sps.id IS NULL;

  SELECT count(*)
  INTO orphan_template_categories
  FROM system_product_type_template_categories sptc
  LEFT JOIN system_product_type_templates spt ON spt.id = sptc.template_id
  WHERE spt.id IS NULL;

  IF orphan_role_permissions > 0 THEN
    RAISE EXCEPTION 'orphan role_permissions found: %', orphan_role_permissions;
  END IF;

  IF orphan_company_users > 0 THEN
    RAISE EXCEPTION 'orphan company_users found: %', orphan_company_users;
  END IF;

  IF orphan_plan_assignments > 0 THEN
    RAISE EXCEPTION 'orphan company_plan_assignments found: %', orphan_plan_assignments;
  END IF;

  IF orphan_storage_snapshots > 0 THEN
    RAISE EXCEPTION 'orphan storage_usage_snapshots found: %', orphan_storage_snapshots;
  END IF;

  IF orphan_company_unit_standards > 0 THEN
    RAISE EXCEPTION 'orphan company_enabled_unit_standards found: %', orphan_company_unit_standards;
  END IF;

  IF orphan_company_process_standards > 0 THEN
    RAISE EXCEPTION 'orphan company_enabled_process_standards found: %', orphan_company_process_standards;
  END IF;

  IF orphan_template_categories > 0 THEN
    RAISE EXCEPTION 'orphan system_product_type_template_categories found: %', orphan_template_categories;
  END IF;
END $$;


DO $$
DECLARE
  missing_indexes text[];
BEGIN
  SELECT array_agg(index_name)
  INTO missing_indexes
  FROM (
    VALUES
      ('spec_sheets_company_created_idx'),
      ('spec_sheets_company_status_created_idx'),
      ('spec_sheets_company_reorder_created_idx'),
      ('orders_company_factory_created_idx'),
      ('attachments_company_size_idx'),
      ('company_workorder_daily_stats_company_date_idx'),
      ('company_workorder_monthly_stats_company_month_idx'),
      ('company_storage_daily_stats_company_date_idx'),
      ('audit_logs_company_created_idx'),
      ('audit_logs_company_event_idx'),
      ('audit_logs_target_idx'),
      ('system_unit_standards_active_idx'),
      ('company_enabled_unit_standards_company_idx'),
      ('system_outsourcing_process_standards_active_idx'),
      ('company_enabled_process_standards_company_idx'),
      ('system_product_type_templates_active_idx'),
      ('system_product_type_template_categories_template_idx')
  ) AS required_indexes(index_name)
  WHERE to_regclass('public.' || required_indexes.index_name) IS NULL;

  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION 'full_reset smoke test failed. Missing stats indexes: %', missing_indexes;
  END IF;
END $$;

DO $$
DECLARE
  invalid_month_rows integer;
BEGIN
  SELECT count(*)
  INTO invalid_month_rows
  FROM company_workorder_monthly_stats
  WHERE stats_month <> date_trunc('month', stats_month)::date;

  IF invalid_month_rows > 0 THEN
    RAISE EXCEPTION 'company_workorder_monthly_stats contains invalid stats_month rows: %', invalid_month_rows;
  END IF;
END $$;


DO $$
DECLARE
  invitation_company_nullable text;
  active_status_exists boolean;
  cancelled_status_exists boolean;
BEGIN
  SELECT is_nullable
  INTO invitation_company_nullable
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'invitations'
    AND column_name = 'company_id';

  IF invitation_company_nullable <> 'YES' THEN
    RAISE EXCEPTION 'invitations.company_id must be nullable for system_to_company_admin invitations';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'invitation_status'
      AND e.enumlabel = 'active'
  ) INTO active_status_exists;

  SELECT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'invitation_status'
      AND e.enumlabel = 'cancelled'
  ) INTO cancelled_status_exists;

  IF NOT active_status_exists OR NOT cancelled_status_exists THEN
    RAISE EXCEPTION 'invitation_status enum must include active and cancelled';
  END IF;
END $$;

SELECT
  'full_reset smoke test passed' AS result,
  (SELECT count(*) FROM companies) AS companies,
  (SELECT count(*) FROM users) AS users,
  (SELECT count(*) FROM company_users) AS company_users,
  (SELECT count(*) FROM role_catalog) AS roles,
  (SELECT count(*) FROM permission_catalog) AS permissions,
  (SELECT count(*) FROM plans) AS plans,
  (SELECT count(*) FROM storage_usage_snapshots) AS storage_snapshots,
  (SELECT count(*) FROM audit_logs) AS audit_logs,
  (SELECT count(*) FROM system_unit_standards) AS system_unit_standards,
  (SELECT count(*) FROM system_outsourcing_process_standards) AS system_process_standards,
  (SELECT count(*) FROM system_product_type_templates) AS system_product_type_templates;


-- 0.9.22417: deleted_at columns used by storage/trash must use timestamptz.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'spec_sheets'
  AND column_name = 'deleted_at'
  AND data_type <> 'timestamp with time zone';
