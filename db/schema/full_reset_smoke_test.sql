-- =========================================
-- PeaceByPiece full_reset smoke test
-- Version: 0.9.203
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
      ('system_users', to_regclass('public.system_users')),
      ('system_permission_catalog', to_regclass('public.system_permission_catalog')),
      ('system_user_permissions', to_regclass('public.system_user_permissions')),
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
      ('memos', 'purged_by')
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
  role_count integer;
  permission_count integer;
  plan_count integer;
  company_count integer;
  system_permission_count integer;
BEGIN
  SELECT count(*) INTO role_count FROM role_catalog;
  SELECT count(*) INTO permission_count FROM permission_catalog;
  SELECT count(*) INTO plan_count FROM plans;
  SELECT count(*) INTO company_count FROM companies;
  SELECT count(*) INTO system_permission_count FROM system_permission_catalog;

  IF role_count < 5 THEN
    RAISE EXCEPTION 'role_catalog seed count too low: %', role_count;
  END IF;

  IF permission_count < 14 THEN
    RAISE EXCEPTION 'permission_catalog seed count too low: %', permission_count;
  END IF;

  IF plan_count < 3 THEN
    RAISE EXCEPTION 'plans seed count too low: %', plan_count;
  END IF;

  IF company_count < 1 THEN
    RAISE EXCEPTION 'companies seed missing';
  END IF;

  IF system_permission_count < 6 THEN
    RAISE EXCEPTION 'system_permission_catalog seed count too low: %', system_permission_count;
  END IF;
END $$;

DO $$
DECLARE
  orphan_role_permissions integer;
  orphan_company_users integer;
  orphan_plan_assignments integer;
  orphan_storage_snapshots integer;
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
      ('company_storage_daily_stats_company_date_idx')
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

SELECT
  'full_reset smoke test passed' AS result,
  (SELECT count(*) FROM companies) AS companies,
  (SELECT count(*) FROM users) AS users,
  (SELECT count(*) FROM company_users) AS company_users,
  (SELECT count(*) FROM role_catalog) AS roles,
  (SELECT count(*) FROM permission_catalog) AS permissions,
  (SELECT count(*) FROM plans) AS plans,
  (SELECT count(*) FROM storage_usage_snapshots) AS storage_snapshots;
