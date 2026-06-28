-- =========================================
-- PeaceByPiece full_reset smoke test
-- Version: 0.16.93
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
      ('company_onboarding_files', to_regclass('public.company_onboarding_files')),
      ('company_files', to_regclass('public.company_files')),
      ('company_feedback_requests', to_regclass('public.company_feedback_requests')),
      ('role_catalog', to_regclass('public.role_catalog')),
      ('permission_catalog', to_regclass('public.permission_catalog')),
      ('role_permissions', to_regclass('public.role_permissions')),
      ('company_user_permissions', to_regclass('public.company_user_permissions')),
      ('company_members', to_regclass('public.company_members')),
      ('company_account_requests', to_regclass('public.company_account_requests')),
      ('signup_applications', to_regclass('public.signup_applications')),
      ('signup_application_files', to_regclass('public.signup_application_files')),
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
      ('workorder_factory_instructions', to_regclass('public.workorder_factory_instructions')),
      ('orders', to_regclass('public.orders')),
      ('attachments', to_regclass('public.attachments')),
      ('audit_logs', to_regclass('public.audit_logs')),
      ('history_logs', to_regclass('public.history_logs')),
      ('partners', to_regclass('public.partners')),
      ('partner_items', to_regclass('public.partner_items')),
      ('materials', to_regclass('public.materials')),
      ('material_attributes_fabric', to_regclass('public.material_attributes_fabric')),
      ('material_attributes_submaterial', to_regclass('public.material_attributes_submaterial')),
      ('workorder_material_lines', to_regclass('public.workorder_material_lines')),
      ('material_orders', to_regclass('public.material_orders')),
      ('material_order_lines', to_regclass('public.material_order_lines')),
      ('material_order_allocations', to_regclass('public.material_order_allocations')),
      ('material_inventory_lots', to_regclass('public.material_inventory_lots'))
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
      ('spec_sheets', 'rejection_reason'),
      ('spec_sheets', 'rejected_at'),
      ('spec_sheets', 'rejected_by_user_id'),
      ('spec_sheets', 'rejected_by_name'),
      ('materials', 'company_id'),
      ('materials', 'kind'),
      ('materials', 'code'),
      ('materials', 'name'),
      ('materials', 'unit'),
      ('materials', 'lifecycle_status'),
      ('material_attributes_fabric', 'material_id'),
      ('material_attributes_submaterial', 'material_id'),
      ('workorder_material_lines', 'company_id'),
      ('workorder_material_lines', 'workorder_id'),
      ('workorder_material_lines', 'material_id'),
      ('workorder_material_lines', 'role'),
      ('workorder_material_lines', 'order_status'),
      ('material_orders', 'company_id'),
      ('material_orders', 'supplier_partner_id'),
      ('material_orders', 'status'),
      ('material_orders', 'requested_by_user_id'),
      ('material_orders', 'approved_by_user_id'),
      ('material_orders', 'ordered_at'),
      ('material_orders', 'total_amount'),
      ('material_order_lines', 'material_order_id'),
      ('material_order_lines', 'partner_item_id'),
      ('material_order_lines', 'item_name'),
      ('material_order_lines', 'item_type'),
      ('material_order_lines', 'order_quantity'),
      ('material_order_lines', 'unit_price'),
      ('material_order_lines', 'amount'),
      ('material_order_allocations', 'material_order_line_id'),
      ('material_order_allocations', 'work_order_id'),
      ('material_order_allocations', 'allocated_quantity'),
      ('material_inventory_lots', 'material_order_line_id'),
      ('material_inventory_lots', 'received_quantity'),
      ('material_inventory_lots', 'allocated_quantity'),
      ('material_inventory_lots', 'remaining_quantity'),
      ('company_workorder_daily_stats', 'stats_date'),
      ('company_workorder_daily_stats', 'created_workorder_count'),
      ('company_workorder_daily_stats', 'reorder_workorder_count'),
      ('company_workorder_monthly_stats', 'stats_month'),
      ('company_workorder_monthly_stats', 'order_quantity_total'),
      ('company_storage_daily_stats', 'stats_date'),
      ('company_storage_daily_stats', 'active_attachment_bytes'),
      ('company_storage_daily_stats', 'purge_requested_count'),
      ('attachments', 'delete_source'),
      ('attachments', 'delete_scope'),
      ('attachments', 'delete_parent_type'),
      ('attachments', 'delete_parent_id'),
      ('attachments', 'delete_batch_id'),
      ('attachments', 'source_type'),
      ('attachments', 'generated_document_type'),
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
      ('companies', 'requested_plan_code'),
      ('companies', 'onboarding_status'),
      ('companies', 'subscription_status'),
      ('companies', 'trial_started_at'),
      ('companies', 'trial_ends_at'),
      ('invitations', 'recipient_email'),
      ('invitations', 'invite_url_path'),
      ('company_onboarding_files', 'company_id'),
      ('company_onboarding_files', 'file_type'),
      ('company_onboarding_files', 'original_name'),
      ('company_onboarding_files', 'storage_key'),
      ('company_onboarding_files', 'mime_type'),
      ('company_onboarding_files', 'size_bytes'),
      ('company_files', 'company_id'),
      ('company_files', 'file_type'),
      ('company_files', 'original_name'),
      ('company_files', 'storage_key'),
      ('company_files', 'mime_type'),
      ('company_files', 'size_bytes'),
      ('company_files', 'review_status'),
      ('company_files', 'uploaded_by_user_id'),
      ('company_files', 'reviewed_by_system_user_id'),
      ('company_files', 'reviewed_at'),
      ('company_files', 'rejection_reason'),
      ('company_files', 'replaced_by_file_id'),
      ('company_files', 'deleted_at'),
      ('company_feedback_requests', 'id'),
      ('company_feedback_requests', 'company_id'),
      ('company_feedback_requests', 'requested_by_user_id'),
      ('company_feedback_requests', 'feedback_type'),
      ('company_feedback_requests', 'feedback_status'),
      ('company_feedback_requests', 'title'),
      ('company_feedback_requests', 'message'),
      ('company_feedback_requests', 'created_at'),
      ('company_subscriptions', 'company_id'),
      ('company_subscriptions', 'plan_code'),
      ('company_subscriptions', 'status'),
      ('company_subscriptions', 'trial_started_at'),
      ('company_subscriptions', 'trial_ends_at'),
      ('company_subscriptions', 'current_period_started_at'),
      ('company_subscriptions', 'current_period_ends_at'),
      ('company_subscriptions', 'cancel_scheduled_at'),
      ('company_subscriptions', 'canceled_at'),
      ('company_subscriptions', 'storage_limit_bytes'),
      ('company_subscriptions', 'member_limit'),
      ('permission_catalog', 'permission_group'),
      ('permission_catalog', 'label_key'),
      ('permission_catalog', 'description_key'),
      ('permission_catalog', 'is_system_permission'),
      ('permission_catalog', 'sort_order'),
      ('company_members', 'role_template_code'),
      ('company_members', 'withdrawal_requested_by'),
      ('company_members', 'withdrawal_requested_at'),
      ('company_members', 'withdrawn_by'),
      ('company_members', 'withdrawn_at'),
      ('company_account_requests', 'company_id'),
      ('company_account_requests', 'requested_by_user_id'),
      ('company_account_requests', 'request_type'),
      ('company_account_requests', 'request_status'),
      ('company_account_requests', 'request_title'),
      ('company_account_requests', 'request_message'),
      ('company_account_requests', 'request_payload'),
        ('company_account_requests', 'reviewed_by_system_user_id'),
      ('member_permissions', 'permission_code'),
      ('role_templates', 'role_code'),
      ('role_template_permissions', 'permission_code'),
      ('invitations', 'invitation_type'),
      ('invitations', 'invited_email'),
      ('invitations', 'target_role_template_code'),
      ('join_requests', 'request_type'),
      ('join_requests', 'applicant_email'),
      ('join_requests', 'business_name'),
      ('join_requests', 'request_memo'),
      ('workorder_factory_instructions', 'work_order_id'),
      ('workorder_factory_instructions', 'company_id'),
      ('workorder_factory_instructions', 'content'),
      ('workorder_factory_instructions', 'include_in_factory_pdf'),
      ('workorder_factory_instructions', 'updated_by_user_id'),
      ('workorder_factory_instructions', 'updated_at'),
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
  missing_production_join_columns text[];
BEGIN
  SELECT array_agg(table_name || '.' || column_name ORDER BY table_name, column_name)
  INTO missing_production_join_columns
  FROM (
    VALUES
      ('orders', 'factory_partner_id'),
      ('spec_sheet_materials', 'vendor_partner_id'),
      ('spec_sheet_outsourcing_lines', 'vendor_partner_id'),
      ('spec_sheet_outsourcing_lines', 'loss_cost'),
      ('workorder_material_lines', 'material_id')
  ) AS required_columns(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = current_schema()
      AND c.table_name = required_columns.table_name
      AND c.column_name = required_columns.column_name
  );

  IF missing_production_join_columns IS NOT NULL THEN
    RAISE EXCEPTION 'full_reset smoke test failed. Missing production partner join columns: %', missing_production_join_columns;
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
  SELECT count(*) INTO member_permission_catalog_count
  FROM permission_catalog
  WHERE is_system_permission = false
    AND permission_group IN (
      'workorder',
      'workflow',
      'partner',
      'storage',
      'stats',
      'settings',
      'standards',
      'member',
      'audit',
      'personal'
    );

  IF role_count < 5 THEN
    RAISE EXCEPTION 'role_catalog seed count too low: %', role_count;
  END IF;

  IF permission_count < 30 THEN
    RAISE EXCEPTION 'permission_catalog seed count too low: %', permission_count;
  END IF;

  IF plan_count < 3 THEN
    RAISE EXCEPTION 'plans seed count too low: %', plan_count;
  END IF;

  -- full_reset은 실제 고객사 seed를 생성하지 않는다.
  -- 고객사 데이터는 초대/온보딩/승인 플로우에서 생성되므로 0건도 정상이다.

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

  IF member_permission_catalog_count < 30 THEN
    RAISE EXCEPTION 'permission_catalog workspace/member seed count too low: %', member_permission_catalog_count;
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
  orphan_materials integer;
  orphan_workorder_material_lines integer;
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

  SELECT count(*)
  INTO orphan_materials
  FROM materials m
  LEFT JOIN companies c ON c.id = m.company_id
  WHERE c.id IS NULL;

  SELECT count(*)
  INTO orphan_workorder_material_lines
  FROM workorder_material_lines wml
  LEFT JOIN companies c ON c.id = wml.company_id
  LEFT JOIN spec_sheets s ON s.id = wml.workorder_id
  LEFT JOIN materials m ON m.id = wml.material_id
  WHERE c.id IS NULL OR s.id IS NULL OR m.id IS NULL;

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

  IF orphan_materials > 0 THEN
    RAISE EXCEPTION 'orphan materials found: %', orphan_materials;
  END IF;

  IF orphan_workorder_material_lines > 0 THEN
    RAISE EXCEPTION 'orphan workorder_material_lines found: %', orphan_workorder_material_lines;
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
      ('workorder_factory_instructions_company_idx'),
      ('spec_sheets_company_status_created_idx'),
      ('spec_sheets_company_reorder_created_idx'),
      ('orders_company_factory_idx'),
      ('orders_company_factory_name_idx'),
      ('spec_sheet_materials_company_source_material_idx'),
      ('spec_sheet_materials_company_vendor_partner_idx'),
      ('spec_sheet_materials_company_vendor_idx'),
      ('spec_sheet_outsourcing_lines_company_source_idx'),
      ('spec_sheet_outsourcing_lines_company_vendor_partner_idx'),
      ('spec_sheet_outsourcing_lines_company_vendor_idx'),
      ('partners_company_name_idx'),
      ('partner_items_company_partner_type_idx'),
      ('materials_company_kind_status_idx'),
      ('materials_company_partner_idx'),
      ('materials_company_code_idx'),
      ('materials_company_name_idx'),
      ('workorder_material_lines_company_workorder_idx'),
      ('workorder_material_lines_company_material_idx'),
      ('workorder_material_lines_company_order_status_idx'),
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
      ('system_product_type_template_categories_template_idx'),
      ('join_requests_pending_invitation_email_unique'),
      ('company_onboarding_files_company_type_active_idx'),
      ('company_onboarding_files_storage_key_unique'),
      ('company_files_company_type_active_idx'),
      ('company_files_storage_key_unique'),
      ('company_files_review_status_idx'),
      ('company_account_requests_company_status_idx'),
      ('company_account_requests_type_created_idx'),
      ('signup_applications_review_queue_idx'),
      ('signup_applications_correction_due_idx'),
      ('signup_applications_active_email_idx'),
      ('signup_applications_active_google_sub_idx'),
      ('signup_applications_active_business_registration_idx'),
      ('signup_applications_created_company_idx'),
      ('signup_applications_created_user_idx'),
      ('signup_applications_created_member_idx'),
      ('signup_applications_created_subscription_idx'),
      ('signup_application_files_application_type_active_idx'),
      ('signup_application_files_storage_key_unique'),
      ('signup_application_files_active_certificate_unique')
  ) AS required_indexes(index_name)
  WHERE to_regclass('public.' || required_indexes.index_name) IS NULL;

  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION 'full_reset smoke test failed. Missing required indexes: %', missing_indexes;
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


DO $$
DECLARE
  join_request_user_nullable text;
BEGIN
  SELECT is_nullable
  INTO join_request_user_nullable
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'join_requests'
    AND column_name = 'user_id';

  IF join_request_user_nullable <> 'YES' THEN
    RAISE EXCEPTION 'join_requests.user_id must be nullable until OAuth user mapping is connected';
  END IF;
END $$;


DO $$
DECLARE
  rejected_status_allowed boolean;
  trial_status_allowed boolean;
  trial_plan_exists boolean;
  plan_code_constraint_exists boolean;
  subscription_status_constraint_exists boolean;
  invitation_url_path_exists boolean;
  member_invitation_link_only_valid boolean;
  company_onboarding_file_type_valid boolean;
  company_file_type_valid boolean;
  company_file_review_status_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'companies'
      AND cc.constraint_name = 'companies_onboarding_status_check'
      AND cc.check_clause LIKE '%rejected%'
  ) INTO rejected_status_allowed;

  IF NOT rejected_status_allowed THEN
    RAISE EXCEPTION 'companies_onboarding_status_check must allow rejected';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'companies'
      AND cc.constraint_name = 'companies_subscription_status_check'
      AND cc.check_clause LIKE '%trial_expired%'
      AND cc.check_clause LIKE '%past_due%'
      AND cc.check_clause LIKE '%canceled%'
      AND cc.check_clause LIKE '%payment_failed%'
      AND cc.check_clause LIKE '%cancel_scheduled%'
      AND cc.check_clause LIKE '%suspended%'
  ) INTO trial_status_allowed;

  IF NOT trial_status_allowed THEN
    RAISE EXCEPTION 'companies_subscription_status_check must allow current subscription statuses';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'company_subscriptions'
      AND cc.constraint_name = 'company_subscriptions_plan_code_check'
      AND cc.check_clause LIKE '%lite%'
      AND cc.check_clause LIKE '%flow%'
      AND cc.check_clause LIKE '%studio%'
      AND cc.check_clause LIKE '%custom%'
  ) INTO plan_code_constraint_exists;

  IF NOT plan_code_constraint_exists THEN
    RAISE EXCEPTION 'company_subscriptions_plan_code_check must allow current plan codes';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'company_subscriptions'
      AND cc.constraint_name = 'company_subscriptions_status_check'
      AND cc.check_clause LIKE '%trialing%'
      AND cc.check_clause LIKE '%active%'
      AND cc.check_clause LIKE '%payment_failed%'
      AND cc.check_clause LIKE '%cancel_scheduled%'
      AND cc.check_clause LIKE '%suspended%'
  ) INTO subscription_status_constraint_exists;

  IF NOT subscription_status_constraint_exists THEN
    RAISE EXCEPTION 'company_subscriptions_status_check must allow current subscription statuses';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM plans
    WHERE id = 'plan-trial'
      AND code = 'trial'
      AND status = 'active'
  ) INTO trial_plan_exists;

  IF NOT trial_plan_exists THEN
    RAISE EXCEPTION 'trial plan seed missing';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'invitations'
      AND column_name = 'invite_url_path'
  ) INTO invitation_url_path_exists;

  IF NOT invitation_url_path_exists THEN
    RAISE EXCEPTION 'invitations.invite_url_path column missing';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'invitations'
      AND cc.constraint_name = 'invitations_recipient_email_scope_check'
      AND cc.check_clause LIKE '%company_to_member%'
      AND cc.check_clause LIKE '%recipient_email IS NULL%'
  ) INTO member_invitation_link_only_valid;

  IF NOT member_invitation_link_only_valid THEN
    RAISE EXCEPTION 'invitations_recipient_email_scope_check must allow link-only company member invitations';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'company_onboarding_files'
      AND cc.constraint_name = 'company_onboarding_files_type_check'
      AND cc.check_clause LIKE '%business_license%'
      AND cc.check_clause LIKE '%logo%'
  ) INTO company_onboarding_file_type_valid;

  IF NOT company_onboarding_file_type_valid THEN
    RAISE EXCEPTION 'company_onboarding_files_type_check must allow logo and business_license';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'company_files'
      AND cc.constraint_name = 'company_files_type_check'
      AND cc.check_clause LIKE '%representative_image%'
      AND cc.check_clause LIKE '%business_registration%'
  ) INTO company_file_type_valid;

  IF NOT company_file_type_valid THEN
    RAISE EXCEPTION 'company_files_type_check must allow representative_image and business_registration';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'company_files'
      AND cc.constraint_name = 'company_files_review_status_check'
      AND cc.check_clause LIKE '%not_required%'
      AND cc.check_clause LIKE '%pending_review%'
      AND cc.check_clause LIKE '%approved%'
      AND cc.check_clause LIKE '%rejected%'
  ) INTO company_file_review_status_valid;

  IF NOT company_file_review_status_valid THEN
    RAISE EXCEPTION 'company_files_review_status_check must allow current review statuses';
  END IF;
END $$;

DO $$
DECLARE
  account_request_type_valid boolean;
  account_request_status_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'company_account_requests'
      AND cc.constraint_name = 'company_account_requests_type_check'
      AND cc.check_clause LIKE '%company_info_change%'
      AND cc.check_clause LIKE '%account_deactivation%'
  ) INTO account_request_type_valid;

  IF NOT account_request_type_valid THEN
    RAISE EXCEPTION 'company_account_requests_type_check must allow current account request types';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = cc.constraint_schema
     AND ccu.constraint_name = cc.constraint_name
    WHERE ccu.table_schema = current_schema()
      AND ccu.table_name = 'company_account_requests'
      AND cc.constraint_name = 'company_account_requests_status_check'
      AND cc.check_clause LIKE '%pending%'
      AND cc.check_clause LIKE '%reviewing%'
      AND cc.check_clause LIKE '%approved%'
      AND cc.check_clause LIKE '%rejected%'
      AND cc.check_clause LIKE '%cancelled%'
  ) INTO account_request_status_valid;

  IF NOT account_request_status_valid THEN
    RAISE EXCEPTION 'company_account_requests_status_check must allow current review statuses';
  END IF;
END $$;


DO $$
DECLARE
  legacy_production_columns text[];
BEGIN
  SELECT array_agg(format('%s.%s', table_name, column_name) ORDER BY table_name, column_name)
  INTO legacy_production_columns
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name IN ('orders', 'spec_sheet_materials', 'spec_sheet_outsourcing_lines')
    AND column_name IN ('company_name', 'is_active', 'deleted_at', 'created_at', 'updated_at');

  IF legacy_production_columns IS NOT NULL THEN
    RAISE EXCEPTION 'full_reset smoke test failed. Legacy production current-table columns remain: %', legacy_production_columns;
  END IF;
END $$;



DO $$
DECLARE
  missing_policy_tables text[];
BEGIN
  SELECT array_agg(expected_table ORDER BY expected_table)
  INTO missing_policy_tables
  FROM (VALUES
    ('policy_documents'),
    ('policy_versions'),
    ('policy_agreements')
  ) AS expected(expected_table)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = expected.expected_table
  );

  IF missing_policy_tables IS NOT NULL THEN
    RAISE EXCEPTION 'policy tables are missing: %', missing_policy_tables;
  END IF;
END $$;

DO $$
DECLARE
  missing_policy_columns text[];
BEGIN
  SELECT array_agg(format('%s.%s', expected_table, expected_column) ORDER BY expected_table, expected_column)
  INTO missing_policy_columns
  FROM (VALUES
    ('policy_documents', 'document_key'),
    ('policy_documents', 'is_customer_visible'),
    ('policy_versions', 'policy_document_id'),
    ('policy_versions', 'is_current'),
    ('policy_versions', 'is_required_for_approval'),
    ('policy_versions', 'requires_reagreement'),
    ('policy_versions', 'content_snapshot'),
    ('policy_agreements', 'policy_version_id'),
    ('policy_agreements', 'company_id'),
    ('policy_agreements', 'user_id'),
    ('policy_agreements', 'agreed_at')
  ) AS expected(expected_table, expected_column)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = expected.expected_table
      AND column_name = expected.expected_column
  );

  IF missing_policy_columns IS NOT NULL THEN
    RAISE EXCEPTION 'policy columns are missing: %', missing_policy_columns;
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
