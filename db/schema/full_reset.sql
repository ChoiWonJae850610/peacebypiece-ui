-- =========================================
-- WAFL full DB reset schema
-- Version: 0.10.79
--
-- 기준:
-- - 현재 코드에서 실제 사용하는 업무 테이블/컬럼 유지
-- - 0.9.56~0.9.71에서 추가한 SaaS 기반 구조 반영
--
-- 주의:
-- - 실행하면 아래 전체 업무 테이블의 기존 데이터가 모두 삭제됩니다.
-- - 운영 DB에는 직접 실행하지 말고 백업 후 개발/초기화 용도로만 사용합니다.
-- =========================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- 1) DROP VIEWS
-- =========================================

DROP VIEW IF EXISTS latest_storage_usage_snapshots CASCADE;
DROP VIEW IF EXISTS expired_pending_invitations CASCADE;

-- =========================================
-- 2) DROP TABLES
-- FK / index / dependent constraints are removed by CASCADE.
-- =========================================

DROP TABLE IF EXISTS material_allocations CASCADE;
DROP TABLE IF EXISTS company_storage_daily_stats CASCADE;
DROP TABLE IF EXISTS company_workorder_daily_stats CASCADE;
DROP TABLE IF EXISTS company_workorder_monthly_stats CASCADE;
DROP TABLE IF EXISTS material_order_lines CASCADE;
DROP TABLE IF EXISTS material_orders CASCADE;

DROP TABLE IF EXISTS system_user_permissions CASCADE;
DROP TABLE IF EXISTS system_permission_catalog CASCADE;
DROP TABLE IF EXISTS system_users CASCADE;

DROP TABLE IF EXISTS storage_usage_snapshots CASCADE;
DROP TABLE IF EXISTS company_plan_assignments CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS member_permissions CASCADE;
DROP TABLE IF EXISTS role_template_permissions CASCADE;
DROP TABLE IF EXISTS role_templates CASCADE;
DROP TABLE IF EXISTS company_members CASCADE;

DROP TABLE IF EXISTS company_user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permission_catalog CASCADE;
DROP TABLE IF EXISTS role_catalog CASCADE;
DROP TABLE IF EXISTS company_users CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS history_logs CASCADE;
DROP TABLE IF EXISTS memos CASCADE;
DROP TABLE IF EXISTS attachment_trash_items CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS spec_sheet_outsourcing_lines CASCADE;
DROP TABLE IF EXISTS material_stocks CASCADE;
DROP TABLE IF EXISTS spec_sheet_materials CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS partner_items CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS outsourcing_processes CASCADE;
DROP TABLE IF EXISTS company_enabled_process_standards CASCADE;
DROP TABLE IF EXISTS company_enabled_unit_standards CASCADE;
DROP TABLE IF EXISTS system_product_type_template_categories CASCADE;
DROP TABLE IF EXISTS system_product_type_templates CASCADE;
DROP TABLE IF EXISTS system_outsourcing_process_standards CASCADE;
DROP TABLE IF EXISTS system_unit_standards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS item_categories CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS spec_sheets CASCADE;

-- =========================================
-- 3) DROP TYPES
-- =========================================

DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS invitation_scope CASCADE;
DROP TYPE IF EXISTS invitation_permission_preset CASCADE;
DROP TYPE IF EXISTS plan_status CASCADE;
DROP TYPE IF EXISTS billing_cycle CASCADE;
DROP TYPE IF EXISTS company_plan_assignment_status CASCADE;
DROP TYPE IF EXISTS storage_usage_snapshot_source CASCADE;

-- =========================================
-- 4) TYPES
-- =========================================

CREATE TYPE invitation_status AS ENUM (
  'pending',
  'active',
  'accepted',
  'expired',
  'revoked',
  'cancelled'
);

CREATE TYPE invitation_scope AS ENUM (
  'system_to_company_admin',
  'company_to_member'
);

CREATE TYPE invitation_permission_preset AS ENUM (
  'company_admin',
  'designer',
  'inspector',
  'inventory_manager',
  'viewer',
  'custom'
);

CREATE TYPE plan_status AS ENUM (
  'draft',
  'active',
  'archived'
);

CREATE TYPE billing_cycle AS ENUM (
  'monthly',
  'yearly'
);

CREATE TYPE company_plan_assignment_status AS ENUM (
  'active',
  'scheduled',
  'expired'
);

CREATE TYPE storage_usage_snapshot_source AS ENUM (
  'db_attachment_metadata',
  'r2_inventory',
  'manual'
);

-- =========================================
-- 5) MASTER TABLES
-- =========================================

CREATE TABLE companies (
  id text PRIMARY KEY,
  name text NOT NULL,
  memo text,
  is_active boolean NOT NULL DEFAULT true,

  english_name text,
  business_name text,
  business_registration_number text,
  logo_url text,
  postal_code text,
  road_address text,
  jibun_address text,
  address_detail text,
  address_extra text,
  requested_plan_code text,
  onboarding_status text NOT NULL DEFAULT 'profile_required',
  onboarding_completed_at timestamptz,
  owner_user_id text,
  default_plan_id text,
  storage_limit_bytes bigint,
  member_limit integer,
  billing_status text NOT NULL DEFAULT 'trial',

  CONSTRAINT companies_onboarding_status_check CHECK (
    onboarding_status IN ('profile_required', 'approval_pending', 'active')
  ),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text,
  name text NOT NULL,
  google_sub text,
  google_picture_url text,
  phone text,
  phone_source text,
  birthday date,
  birthday_source text,
  role text NOT NULL DEFAULT 'designer',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_google_sub_unique UNIQUE (google_sub),
  CONSTRAINT users_phone_source_check CHECK (phone_source IS NULL OR phone_source IN ('google', 'user', 'invitation')),
  CONSTRAINT users_birthday_source_check CHECK (birthday_source IS NULL OR birthday_source IN ('user')),
  CONSTRAINT users_role_check CHECK (
    role IN ('admin', 'designer', 'inspector', 'inventory_manager', 'viewer', 'system')
  )
);

CREATE TABLE company_users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_name text,
  joined_at timestamptz,
  invited_by_user_id text REFERENCES users(id),
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_users_company_user_role_unique UNIQUE (company_id, user_id, role)
);

CREATE TABLE role_catalog (
  role text PRIMARY KEY,
  label text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE permission_catalog (
  permission_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
  role text NOT NULL REFERENCES role_catalog(role) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission_key)
);

CREATE TABLE company_user_permissions (
  company_user_id text NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_user_id, permission_key)
);

CREATE TABLE system_users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'system_admin',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE system_permission_catalog (
  permission_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'system',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE system_user_permissions (
  system_user_id text NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES system_permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (system_user_id, permission_key)
);

CREATE TABLE company_settings (
  company_id text PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  theme_color text NOT NULL DEFAULT 'blue',
  language text NOT NULL DEFAULT 'ko',
  compact_mode boolean NOT NULL DEFAULT false,
  soft_delete_enabled boolean NOT NULL DEFAULT true,
  include_trash_in_usage boolean NOT NULL DEFAULT true,
  trash_retention_days integer NOT NULL DEFAULT 15,
  storage_limit_gb integer NOT NULL DEFAULT 5,
  warning_threshold_percent integer NOT NULL DEFAULT 80,
  review_request_enabled boolean NOT NULL DEFAULT true,
  order_ready_enabled boolean NOT NULL DEFAULT true,
  storage_warning_enabled boolean NOT NULL DEFAULT true,
  purge_result_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_settings_theme_color_check CHECK (theme_color IN ('blue', 'emerald', 'violet', 'stone')),
  CONSTRAINT company_settings_language_check CHECK (language IN ('ko', 'en')),
  CONSTRAINT company_settings_trash_retention_days_check CHECK (trash_retention_days IN (1, 5, 15, 30)),
  CONSTRAINT company_settings_storage_limit_gb_check CHECK (storage_limit_gb > 0),
  CONSTRAINT company_settings_warning_threshold_percent_check CHECK (warning_threshold_percent BETWEEN 1 AND 100)
);

CREATE TABLE system_unit_standards (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  korean_name text NOT NULL,
  english_code text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  example_label text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE company_enabled_unit_standards (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_standard_id text NOT NULL REFERENCES system_unit_standards(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  custom_label text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, unit_standard_id)
);

CREATE TABLE system_outsourcing_process_standards (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  example_label text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE company_enabled_process_standards (
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  process_standard_id text NOT NULL REFERENCES system_outsourcing_process_standards(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  custom_label text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, process_standard_id)
);

CREATE TABLE system_product_type_templates (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE system_product_type_template_categories (
  id text PRIMARY KEY,
  template_id text NOT NULL REFERENCES system_product_type_templates(id) ON DELETE CASCADE,
  parent_id text REFERENCES system_product_type_template_categories(id) ON DELETE CASCADE,
  level integer NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_product_type_template_categories_level_check CHECK (level IN (1, 2, 3)),
  CONSTRAINT system_product_type_template_categories_unique UNIQUE (template_id, parent_id, name)
);

CREATE TABLE units (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT units_company_code_unique UNIQUE (company_id, code)
);

CREATE TABLE item_categories (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id text REFERENCES item_categories(id) ON DELETE CASCADE,
  level integer NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_categories_level_check CHECK (level IN (1, 2, 3)),
  CONSTRAINT item_categories_company_parent_name_unique UNIQUE (company_id, parent_id, name)
);

CREATE TABLE outsourcing_processes (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  name text NOT NULL,
  memo text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE partners (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  name text NOT NULL,
  contact_person text,
  contact text,
  email text,
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE partner_items (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  partner_id text NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_name text,
  outsourcing_process_id text REFERENCES outsourcing_processes(id) ON DELETE SET NULL,
  unit text,
  unit_cost numeric(14, 2) NOT NULL DEFAULT 0,
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_items_type_check CHECK (item_type IN ('factory', 'fabric', 'subsidiary', 'outsourcing'))
);

-- =========================================
-- 6) CORE WORKORDER TABLES
-- =========================================

CREATE TABLE spec_sheets (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  work_order_kind text,
  reorder_group_id text,
  reorder_round integer NOT NULL DEFAULT 0,
  parent_spec_sheet_id text REFERENCES spec_sheets(id) ON DELETE SET NULL,
  is_rework boolean NOT NULL DEFAULT false,
  category1_id text REFERENCES item_categories(id) ON DELETE SET NULL,
  category2_id text REFERENCES item_categories(id) ON DELETE SET NULL,
  category3_id text REFERENCES item_categories(id) ON DELETE SET NULL,
  display_title text,
  base_title text,
  category1 text,
  category2 text,
  category3 text,
  season text,
  priority text,
  vendor text,
  manager text,
  manager_id text,
  created_by_id text,
  created_by_role text,
  due_date text,
  quantity integer NOT NULL DEFAULT 0,
  inventory_quantity integer NOT NULL DEFAULT 0,
  inventory_status text NOT NULL DEFAULT 'unchecked',
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  delete_status text NOT NULL DEFAULT 'active',
  purge_status text NOT NULL DEFAULT 'none',
  purge_requested_at timestamptz,
  purge_requested_by text,
  delete_source text,
  delete_scope text,
  delete_parent_type text,
  delete_parent_id text,
  delete_batch_id text,
  purged_at timestamptz,
  purged_by text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT spec_sheets_delete_status_check CHECK (
    delete_status IN ('active', 'trashed', 'purge_requested', 'purged', 'restored')
  ),
  CONSTRAINT spec_sheets_purge_status_check CHECK (
    purge_status IN ('none', 'pending', 'purge_requested', 'processing', 'purged', 'failed', 'restored')
  ),
  CONSTRAINT spec_sheets_delete_source_check CHECK (
    delete_source IS NULL OR delete_source IN ('manual', 'workorder_bundle', 'system')
  ),
  CONSTRAINT spec_sheets_delete_scope_check CHECK (
    delete_scope IS NULL OR delete_scope IN ('single', 'bundle')
  ),
  CONSTRAINT spec_sheets_delete_parent_type_check CHECK (
    delete_parent_type IS NULL OR delete_parent_type IN ('none', 'workorder')
  )
);

CREATE TABLE orders (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_order_entry_id text,
  factory_partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  factory_name text,
  quantity integer NOT NULL DEFAULT 0,
  due_date text,
  labor_cost integer NOT NULL DEFAULT 0,
  loss_cost integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE spec_sheet_materials (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_material_id text,
  material_type text,
  name text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE material_stocks (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  source_order_line_id text,
  available_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  reserved_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  material_type text,
  name text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  source_spec_sheet_id text REFERENCES spec_sheets(id) ON DELETE SET NULL,
  source_spec_sheet_material_id text REFERENCES spec_sheet_materials(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE spec_sheet_outsourcing_lines (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  source_outsourcing_id text,
  process text,
  vendor text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- 7) ATTACHMENTS / MEMOS / HISTORY
-- =========================================

CREATE TABLE attachments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'file',
  storage_key text NOT NULL,
  original_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  author_id text,
  is_primary boolean NOT NULL DEFAULT false,
  thumbnail_key text,
  thumbnail_url text,
  preview_url text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  deleted_by text,
  delete_source text,
  delete_scope text,
  delete_parent_type text,
  delete_parent_id text,
  delete_batch_id text,
  purge_after_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attachment_trash_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  attachment_id text NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  thumbnail_key text,
  original_name text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  deleted_by text,
  delete_source text,
  delete_scope text,
  delete_parent_type text,
  delete_parent_id text,
  delete_batch_id text,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  purge_after_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  restored_at timestamptz,
  restored_by text,
  purged_at timestamptz,
  purge_requested_by text,
  purge_failure_code text,
  purge_status text NOT NULL DEFAULT 'pending',
  purge_attempt_count integer NOT NULL DEFAULT 0,
  last_purge_attempt_at timestamptz,
  last_purge_error text,
  CONSTRAINT attachment_trash_items_purge_status_check CHECK (
    purge_status IN ('pending', 'restored', 'purge_requested', 'processing', 'purged', 'failed')
  ),
  CONSTRAINT attachment_trash_items_delete_source_check CHECK (
    delete_source IS NULL OR delete_source IN ('manual', 'workorder_bundle', 'system')
  ),
  CONSTRAINT attachment_trash_items_delete_scope_check CHECK (
    delete_scope IS NULL OR delete_scope IN ('single', 'bundle')
  ),
  CONSTRAINT attachment_trash_items_delete_parent_type_check CHECK (
    delete_parent_type IS NULL OR delete_parent_type IN ('none', 'workorder')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  order_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  parent_id text REFERENCES memos(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id text,
  is_active boolean NOT NULL DEFAULT true,
  delete_status text NOT NULL DEFAULT 'active',
  purge_status text NOT NULL DEFAULT 'none',
  purge_requested_at timestamptz,
  purge_requested_by text,
  delete_source text,
  delete_scope text,
  delete_parent_type text,
  delete_parent_id text,
  delete_batch_id text,
  purged_at timestamptz,
  purged_by text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memos_delete_status_check CHECK (
    delete_status IN ('active', 'trashed', 'purge_requested', 'purged', 'restored')
  ),
  CONSTRAINT memos_purge_status_check CHECK (
    purge_status IN ('none', 'pending', 'purge_requested', 'processing', 'purged', 'failed', 'restored')
  ),
  CONSTRAINT memos_delete_source_check CHECK (
    delete_source IS NULL OR delete_source IN ('manual', 'workorder_bundle', 'system')
  ),
  CONSTRAINT memos_delete_scope_check CHECK (
    delete_scope IS NULL OR delete_scope IN ('single', 'bundle')
  ),
  CONSTRAINT memos_delete_parent_type_check CHECK (
    delete_parent_type IS NULL OR delete_parent_type IN ('none', 'workorder')
  )
);


CREATE TABLE audit_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id text,
  actor_role text NOT NULL,
  company_id text REFERENCES companies(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id text,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id text,
  ip_address inet,
  CONSTRAINT audit_logs_actor_role_check CHECK (
    actor_role IN ('system_admin', 'customer_admin', 'designer', 'inspector', 'factory', 'system', 'unknown')
  ),
  CONSTRAINT audit_logs_target_type_check CHECK (
    target_type IN ('company', 'member', 'invitation', 'plan', 'storage', 'work_order', 'file', 'memo', 'settings', 'auth', 'system')
  ),
  CONSTRAINT audit_logs_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT audit_logs_event_type_format_check CHECK (
    event_type ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'
  )
);

CREATE TABLE history_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT history_logs_action_type_check CHECK (
    action_type IN (
      'WORKORDER_CREATED',
      'STATUS_CHANGED',
      'FILE_UPLOADED',
      'FILE_DELETED',
      'PARTNER_UPDATED',
      'SETTINGS_CHANGED'
    )
  ),
  CONSTRAINT history_logs_target_type_check CHECK (
    target_type IN ('workorder', 'file', 'partner', 'settings')
  )
);

-- =========================================
-- 8) MATERIAL ORDER / ALLOCATION
-- =========================================

CREATE TABLE material_orders (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  order_no text,
  vendor_partner_id text REFERENCES partners(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  order_date date,
  expected_received_date date,
  received_date date,
  memo text,
  created_by_id text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT material_orders_status_check CHECK (
    status IN ('draft', 'requested', 'ordered', 'partially_received', 'received', 'cancelled')
  )
);

CREATE TABLE material_order_lines (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  material_order_id text NOT NULL REFERENCES material_orders(id) ON DELETE CASCADE,
  spec_sheet_id text REFERENCES spec_sheets(id) ON DELETE SET NULL,
  spec_sheet_material_id text REFERENCES spec_sheet_materials(id) ON DELETE SET NULL,
  partner_item_id text REFERENCES partner_items(id) ON DELETE SET NULL,
  material_type text NOT NULL,
  name text NOT NULL,
  unit text,
  ordered_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  received_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  unit_cost numeric(14, 2) NOT NULL DEFAULT 0,
  total_cost numeric(14, 2) NOT NULL DEFAULT 0,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT material_order_lines_type_check CHECK (material_type IN ('fabric', 'subsidiary'))
);

CREATE TABLE material_allocations (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  material_stock_id text REFERENCES material_stocks(id) ON DELETE SET NULL,
  material_order_line_id text REFERENCES material_order_lines(id) ON DELETE SET NULL,
  spec_sheet_id text NOT NULL REFERENCES spec_sheets(id) ON DELETE CASCADE,
  spec_sheet_material_id text REFERENCES spec_sheet_materials(id) ON DELETE SET NULL,
  material_type text NOT NULL,
  name text NOT NULL,
  unit text,
  allocated_quantity numeric(14, 2) NOT NULL DEFAULT 0,
  memo text,
  allocated_by_id text,
  allocated_by_name text,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT material_allocations_type_check CHECK (material_type IN ('fabric', 'subsidiary'))
);

-- =========================================
-- 9) INVITATIONS
-- =========================================

CREATE TABLE invitations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text REFERENCES companies(id) ON DELETE CASCADE,
  scope invitation_scope NOT NULL,
  recipient_email text NOT NULL,
  recipient_role text NOT NULL,
  permission_preset invitation_permission_preset NOT NULL DEFAULT 'viewer',
  token_hash text NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by_user_id text REFERENCES users(id),
  created_by_system_user_id text REFERENCES system_users(id),
  accepted_user_id text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invitations_recipient_email_not_empty CHECK (length(trim(recipient_email)) > 0),
  CONSTRAINT invitations_token_hash_not_empty CHECK (length(trim(token_hash)) > 0),
  CONSTRAINT invitations_expires_after_created CHECK (expires_at > created_at),
  CONSTRAINT invitations_acceptance_consistency CHECK (
    (status = 'accepted' AND accepted_at IS NOT NULL) OR (status <> 'accepted')
  ),
  CONSTRAINT invitations_revocation_consistency CHECK (
    (status = 'revoked' AND revoked_at IS NOT NULL) OR (status <> 'revoked')
  ),
  CONSTRAINT invitations_creator_consistency CHECK (
    (scope = 'system_to_company_admin' AND created_by_system_user_id IS NOT NULL)
    OR
    (scope = 'company_to_member' AND created_by_user_id IS NOT NULL)
  ),
  CONSTRAINT invitations_scope_role_consistency CHECK (
    (
      scope = 'system_to_company_admin'
      AND recipient_role = 'admin'
      AND permission_preset = 'company_admin'
    )
    OR
    (
      scope = 'company_to_member'
      AND recipient_role IN ('designer', 'inspector', 'inventory_manager', 'viewer')
    )
  )
);

-- =========================================
-- 10) PLAN / STORAGE
-- =========================================

CREATE TABLE plans (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code text NOT NULL,
  name text NOT NULL,
  status plan_status NOT NULL DEFAULT 'draft',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  price_krw integer NOT NULL DEFAULT 0,
  included_storage_bytes bigint NOT NULL DEFAULT 0,
  max_storage_bytes bigint,
  allow_storage_override boolean NOT NULL DEFAULT true,
  included_members integer NOT NULL DEFAULT 1,
  max_members integer,
  allow_member_override boolean NOT NULL DEFAULT true,
  workorder_limit_enabled boolean NOT NULL DEFAULT false,
  inventory_enabled boolean NOT NULL DEFAULT true,
  system_stats_enabled boolean NOT NULL DEFAULT false,
  advanced_stats_enabled boolean NOT NULL DEFAULT false,
  invitation_enabled boolean NOT NULL DEFAULT true,
  storage_management_enabled boolean NOT NULL DEFAULT true,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plans_code_not_empty CHECK (length(trim(code)) > 0),
  CONSTRAINT plans_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT plans_price_non_negative CHECK (price_krw >= 0),
  CONSTRAINT plans_included_storage_non_negative CHECK (included_storage_bytes >= 0),
  CONSTRAINT plans_max_storage_non_negative CHECK (max_storage_bytes IS NULL OR max_storage_bytes >= 0),
  CONSTRAINT plans_storage_range_valid CHECK (max_storage_bytes IS NULL OR max_storage_bytes >= included_storage_bytes),
  CONSTRAINT plans_included_members_non_negative CHECK (included_members >= 0),
  CONSTRAINT plans_max_members_non_negative CHECK (max_members IS NULL OR max_members >= 0),
  CONSTRAINT plans_member_range_valid CHECK (max_members IS NULL OR max_members >= included_members)
);

CREATE TABLE company_plan_assignments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status company_plan_assignment_status NOT NULL DEFAULT 'active',
  override_storage_limit_bytes bigint,
  override_member_limit integer,
  override_price_krw integer,
  override_memo text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by_system_user_id text REFERENCES system_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_plan_override_storage_non_negative CHECK (
    override_storage_limit_bytes IS NULL OR override_storage_limit_bytes >= 0
  ),
  CONSTRAINT company_plan_override_member_non_negative CHECK (
    override_member_limit IS NULL OR override_member_limit >= 0
  ),
  CONSTRAINT company_plan_override_price_non_negative CHECK (
    override_price_krw IS NULL OR override_price_krw >= 0
  ),
  CONSTRAINT company_plan_period_valid CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE storage_usage_snapshots (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  used_bytes bigint NOT NULL DEFAULT 0,
  attachment_count integer NOT NULL DEFAULT 0,
  source storage_usage_snapshot_source NOT NULL DEFAULT 'db_attachment_metadata',
  measured_at timestamptz NOT NULL DEFAULT now(),
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storage_usage_used_bytes_non_negative CHECK (used_bytes >= 0),
  CONSTRAINT storage_usage_attachment_count_non_negative CHECK (attachment_count >= 0)
);


-- =========================================
-- 11) STATS SUMMARY TABLES
-- =========================================

CREATE TABLE company_workorder_daily_stats (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stats_date date NOT NULL,
  created_workorder_count integer NOT NULL DEFAULT 0,
  active_workorder_count integer NOT NULL DEFAULT 0,
  completed_workorder_count integer NOT NULL DEFAULT 0,
  trashed_workorder_count integer NOT NULL DEFAULT 0,
  reorder_workorder_count integer NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  order_quantity_total numeric(14, 2) NOT NULL DEFAULT 0,
  labor_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  loss_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  memo_count integer NOT NULL DEFAULT 0,
  attachment_count integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_workorder_daily_stats_unique UNIQUE (company_id, stats_date),
  CONSTRAINT company_workorder_daily_stats_non_negative CHECK (
    created_workorder_count >= 0
    AND active_workorder_count >= 0
    AND completed_workorder_count >= 0
    AND trashed_workorder_count >= 0
    AND reorder_workorder_count >= 0
    AND order_count >= 0
    AND order_quantity_total >= 0
    AND labor_cost_total >= 0
    AND loss_cost_total >= 0
    AND memo_count >= 0
    AND attachment_count >= 0
  )
);

CREATE TABLE company_workorder_monthly_stats (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stats_month date NOT NULL,
  created_workorder_count integer NOT NULL DEFAULT 0,
  active_workorder_count integer NOT NULL DEFAULT 0,
  completed_workorder_count integer NOT NULL DEFAULT 0,
  trashed_workorder_count integer NOT NULL DEFAULT 0,
  reorder_workorder_count integer NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  order_quantity_total numeric(14, 2) NOT NULL DEFAULT 0,
  labor_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  loss_cost_total numeric(14, 2) NOT NULL DEFAULT 0,
  memo_count integer NOT NULL DEFAULT 0,
  attachment_count integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_workorder_monthly_stats_unique UNIQUE (company_id, stats_month),
  CONSTRAINT company_workorder_monthly_stats_month_start CHECK (stats_month = date_trunc('month', stats_month)::date),
  CONSTRAINT company_workorder_monthly_stats_non_negative CHECK (
    created_workorder_count >= 0
    AND active_workorder_count >= 0
    AND completed_workorder_count >= 0
    AND trashed_workorder_count >= 0
    AND reorder_workorder_count >= 0
    AND order_count >= 0
    AND order_quantity_total >= 0
    AND labor_cost_total >= 0
    AND loss_cost_total >= 0
    AND memo_count >= 0
    AND attachment_count >= 0
  )
);

CREATE TABLE company_storage_daily_stats (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stats_date date NOT NULL,
  active_attachment_count integer NOT NULL DEFAULT 0,
  active_attachment_bytes bigint NOT NULL DEFAULT 0,
  trash_attachment_count integer NOT NULL DEFAULT 0,
  trash_attachment_bytes bigint NOT NULL DEFAULT 0,
  purge_requested_count integer NOT NULL DEFAULT 0,
  purge_failed_count integer NOT NULL DEFAULT 0,
  purged_count integer NOT NULL DEFAULT 0,
  purged_bytes bigint NOT NULL DEFAULT 0,
  thumbnail_count integer NOT NULL DEFAULT 0,
  logical_attachment_count integer NOT NULL DEFAULT 0,
  physical_attachment_bytes bigint NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_storage_daily_stats_unique UNIQUE (company_id, stats_date),
  CONSTRAINT company_storage_daily_stats_non_negative CHECK (
    active_attachment_count >= 0
    AND active_attachment_bytes >= 0
    AND trash_attachment_count >= 0
    AND trash_attachment_bytes >= 0
    AND purge_requested_count >= 0
    AND purge_failed_count >= 0
    AND purged_count >= 0
    AND purged_bytes >= 0
    AND thumbnail_count >= 0
    AND logical_attachment_count >= 0
    AND physical_attachment_bytes >= 0
  )
);

-- =========================================
-- 12) VIEWS
-- =========================================

CREATE OR REPLACE VIEW expired_pending_invitations AS
SELECT *
FROM invitations
WHERE status = 'pending'
  AND expires_at <= now();

CREATE OR REPLACE VIEW latest_storage_usage_snapshots AS
SELECT DISTINCT ON (company_id)
  id,
  company_id,
  used_bytes,
  attachment_count,
  source,
  measured_at,
  memo,
  created_at
FROM storage_usage_snapshots
ORDER BY company_id, measured_at DESC, created_at DESC;

-- =========================================
-- 13) SEED DATA
-- =========================================

INSERT INTO companies (id, name, memo, is_active)
VALUES ('company-sample-customer', '샘플 고객사', '기본 샘플 고객사', true);

INSERT INTO company_settings (company_id)
VALUES ('company-sample-customer');

INSERT INTO users (id, company_id, email, name, role, is_active)
VALUES
  ('user-sample-admin', 'company-sample-customer', 'admin@example.com', '샘플 관리자', 'admin', true),
  ('user-sample-designer', 'company-sample-customer', 'designer@example.com', '샘플 디자이너', 'designer', true),
  ('user-sample-inspector', 'company-sample-customer', 'inspector@example.com', '샘플 검수담당자', 'inspector', true);

INSERT INTO company_users (id, company_id, user_id, role, is_active, display_name)
VALUES
  ('company-user-sample-admin', 'company-sample-customer', 'user-sample-admin', 'admin', true, '샘플 관리자'),
  ('company-user-sample-designer', 'company-sample-customer', 'user-sample-designer', 'designer', true, '샘플 디자이너'),
  ('company-user-sample-inspector', 'company-sample-customer', 'user-sample-inspector', 'inspector', true, '샘플 검수담당자');

INSERT INTO role_catalog (role, label, description, is_system, is_active)
VALUES
  ('admin', '관리자', '고객사 내부 관리자 역할', false, true),
  ('designer', '디자이너', '작업지시서 작성 및 검토요청 역할', false, true),
  ('inspector', '검수담당자', '생산 및 검수 확인 역할', false, true),
  ('inventory_manager', '재고담당자', '재고 관리 역할', false, true),
  ('viewer', '조회자', '읽기 중심 역할', false, true);

INSERT INTO permission_catalog (permission_key, label, description, category, is_active)
VALUES
  ('workorder.create', '작업지시서 생성', '작업지시서를 생성할 수 있다.', 'workorder', true),
  ('workorder.edit', '작업지시서 수정', '작업지시서 기본 정보를 수정할 수 있다.', 'workorder', true),
  ('workorder.request_review', '검토요청', '작업지시서 검토요청을 할 수 있다.', 'workorder', true),
  ('workorder.skip_review', '검토 생략', '검토요청 없이 다음 단계로 진행할 수 있다.', 'workorder', true),
  ('workorder.request_order', '발주요청', '발주요청 액션을 실행할 수 있다.', 'workorder', true),
  ('workorder.inspect', '검수', '검수 단계의 확인 액션을 실행할 수 있다.', 'workorder', true),
  ('workorder.complete', '완료', '작업지시서를 완료 처리할 수 있다.', 'workorder', true),
  ('inventory.manage', '재고 관리', '재고 데이터를 관리할 수 있다.', 'inventory', true),
  ('partner.manage', '거래처 관리', '거래처/공장/외주처 기준정보를 관리할 수 있다.', 'partner', true),
  ('member.invite', '멤버 초대', '고객사 멤버를 초대할 수 있다.', 'member', true),
  ('billing.manage', '요금제 관리', '고객사 요금제와 과금 관련 설정을 관리할 수 있다.', 'billing', true),
  ('storage.manage', '저장공간 관리', '고객사 저장공간 정책과 삭제 요청을 관리할 수 있다.', 'storage', true),
  ('stats.view', '통계 조회', '고객사 통계를 조회할 수 있다.', 'stats', true),
  ('system.audit.view', '시스템 감사 로그 조회', '시스템관리자 감사 로그를 조회할 수 있다.', 'system', true);

INSERT INTO role_permissions (role, permission_key, is_enabled)
VALUES
  ('admin', 'workorder.create', true),
  ('admin', 'workorder.edit', true),
  ('admin', 'workorder.request_review', true),
  ('admin', 'workorder.skip_review', true),
  ('admin', 'workorder.request_order', true),
  ('admin', 'workorder.inspect', true),
  ('admin', 'workorder.complete', true),
  ('admin', 'inventory.manage', true),
  ('admin', 'partner.manage', true),
  ('admin', 'member.invite', true),
  ('admin', 'billing.manage', false),
  ('admin', 'storage.manage', true),
  ('admin', 'stats.view', true),
  ('designer', 'workorder.create', true),
  ('designer', 'workorder.edit', true),
  ('designer', 'workorder.request_review', true),
  ('designer', 'workorder.skip_review', false),
  ('designer', 'workorder.request_order', false),
  ('designer', 'workorder.inspect', false),
  ('designer', 'workorder.complete', false),
  ('designer', 'inventory.manage', false),
  ('designer', 'partner.manage', false),
  ('designer', 'member.invite', false),
  ('designer', 'storage.manage', false),
  ('designer', 'stats.view', false),
  ('inspector', 'workorder.inspect', true),
  ('inspector', 'workorder.complete', true),
  ('inventory_manager', 'inventory.manage', true),
  ('viewer', 'stats.view', true);

INSERT INTO system_users (id, email, name, role, is_active)
VALUES ('system-user-sample-admin', 'system@example.com', '샘플 시스템관리자', 'system_admin', true);

INSERT INTO system_permission_catalog (permission_key, label, description, category, is_active)
VALUES
  ('system.company.manage', '고객사 관리', '시스템관리자가 고객사를 관리할 수 있다.', 'company', true),
  ('system.company.invite_admin', '고객관리자 초대', '시스템관리자가 고객사 관리자를 초대할 수 있다.', 'invite', true),
  ('system.plan.manage', '요금제 관리', '시스템관리자가 고객사 요금제와 용량 정책을 관리할 수 있다.', 'billing', true),
  ('system.storage.manage', '저장공간 관리', '시스템관리자가 고객사 저장공간 정책을 관리할 수 있다.', 'storage', true),
  ('system.stats.view', '시스템 통계 조회', '시스템관리자가 전체 통계를 조회할 수 있다.', 'stats', true),
  ('system.audit.view', '감사 로그 조회', '시스템관리자가 감사 로그를 조회할 수 있다.', 'audit', true),
  ('system.standard.manage', '시스템 기준정보 관리', '시스템관리자가 단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿을 관리할 수 있다.', 'standards', true);

INSERT INTO system_user_permissions (system_user_id, permission_key, is_enabled)
SELECT 'system-user-sample-admin', permission_key, true
FROM system_permission_catalog;

INSERT INTO system_unit_standards (id, code, korean_name, english_code, category, description, example_label, is_active, sort_order)
VALUES
  ('system-unit-piece', 'piece', '장', 'pcs', 'count', '일반 의류 수량 단위', '티셔츠 100장', true, 10),
  ('system-unit-each', 'each', '개', 'ea', 'count', '부자재 개수 단위', '단추 100개', true, 15),
  ('system-unit-set', 'set', '벌', 'set', 'count', '상하의 세트 또는 묶음 단위', '트레이닝 세트 50벌', true, 20),
  ('system-unit-meter', 'meter', '미터', 'm', 'length', '원단 길이 단위', '면 원단 30m', true, 30),
  ('system-unit-yard', 'yard', '야드', 'yd', 'length', '수입 원단 길이 단위', '수입 원단 20yd', true, 40),
  ('system-unit-roll', 'roll', '롤', 'roll', 'bundle', '롤 단위 원부자재', '심지 3롤', true, 50),
  ('system-unit-box', 'box', '박스', 'box', 'bundle', '박스 단위 부자재', '단추 2박스', true, 60),
  ('system-unit-process', 'process', '공정', 'process', 'service', '외주공정 단위', '자수 1공정', true, 70);

INSERT INTO company_enabled_unit_standards (company_id, unit_standard_id, is_enabled, sort_order)
SELECT 'company-sample-customer', id, true, sort_order
FROM system_unit_standards;

INSERT INTO system_outsourcing_process_standards (id, code, name, category, description, example_label, is_active, sort_order)
VALUES
  ('system-process-printing', 'printing', '나염', 'surface', '원단 또는 완제품 위 프린트 공정', '앞판 나염', true, 10),
  ('system-process-embroidery', 'embroidery', '자수', 'surface', '로고·문양 자수 공정', '가슴 로고 자수', true, 20),
  ('system-process-washing', 'washing', '워싱', 'finishing', '수축·질감·후가공 워싱 공정', '바이오 워싱', true, 30),
  ('system-process-pleats', 'pleats', '플리츠', 'finishing', '주름 고정 외주 공정', '스커트 플리츠', true, 40),
  ('system-process-bonding', 'bonding', '본딩', 'construction', '원단 또는 부자재 접착 공정', '심지 본딩', true, 50);

INSERT INTO company_enabled_process_standards (company_id, process_standard_id, is_enabled, sort_order)
SELECT 'company-sample-customer', id, true, sort_order
FROM system_outsourcing_process_standards;

INSERT INTO system_product_type_templates (id, code, name, description, is_default, is_active, sort_order)
VALUES
  ('template-apparel-basic', 'apparel-basic', '의류 기본 템플릿', '신규 고객사 생성 시 복사할 1차-2차-3차 생산품 유형 기본값입니다.', true, true, 10);

INSERT INTO system_product_type_template_categories (id, template_id, parent_id, level, name, is_active, sort_order)
VALUES
  ('template-apparel-basic:상의', 'template-apparel-basic', NULL, 1, '상의', true, 10),
  ('template-apparel-basic:상의:티셔츠', 'template-apparel-basic', 'template-apparel-basic:상의', 2, '티셔츠', true, 10),
  ('template-apparel-basic:상의:티셔츠:반팔', 'template-apparel-basic', 'template-apparel-basic:상의:티셔츠', 3, '반팔', true, 10),
  ('template-apparel-basic:하의', 'template-apparel-basic', NULL, 1, '하의', true, 20),
  ('template-apparel-basic:하의:팬츠', 'template-apparel-basic', 'template-apparel-basic:하의', 2, '팬츠', true, 10),
  ('template-apparel-basic:하의:팬츠:슬랙스', 'template-apparel-basic', 'template-apparel-basic:하의:팬츠', 3, '슬랙스', true, 10),
  ('template-apparel-basic:아우터', 'template-apparel-basic', NULL, 1, '아우터', true, 30),
  ('template-apparel-basic:아우터:자켓', 'template-apparel-basic', 'template-apparel-basic:아우터', 2, '자켓', true, 10),
  ('template-apparel-basic:아우터:자켓:테일러드', 'template-apparel-basic', 'template-apparel-basic:아우터:자켓', 3, '테일러드', true, 10);

INSERT INTO units (id, company_id, code, name, category, is_active, sort_order)
VALUES
  ('mock-unit-piece', 'company-sample-customer', 'piece', '개', 'count', true, 10),
  ('mock-unit-sheet', 'company-sample-customer', 'sheet', '장', 'count', true, 20),
  ('mock-unit-set', 'company-sample-customer', 'set', '세트', 'count', true, 30),
  ('mock-unit-yard', 'company-sample-customer', 'yard', '야드', 'length', true, 40),
  ('mock-unit-meter', 'company-sample-customer', 'meter', '미터', 'length', true, 50),
  ('mock-unit-roll', 'company-sample-customer', 'roll', '롤', 'bundle', true, 60),
  ('mock-unit-pack', 'company-sample-customer', 'pack', '팩', 'bundle', true, 70),
  ('mock-unit-box', 'company-sample-customer', 'box', '박스', 'bundle', true, 80),
  ('mock-unit-process', 'company-sample-customer', 'process', '공정', 'service', true, 90),
  ('mock-unit-case', 'company-sample-customer', 'case', '건', 'service', true, 100);

INSERT INTO item_categories (id, company_id, parent_id, level, name, is_active, sort_order)
VALUES
  ('category:상의', 'company-sample-customer', NULL, 1, '상의', true, 10),
  ('category:상의:티셔츠', 'company-sample-customer', 'category:상의', 2, '티셔츠', true, 10),
  ('category:상의:티셔츠:반팔', 'company-sample-customer', 'category:상의:티셔츠', 3, '반팔', true, 10),
  ('category:하의', 'company-sample-customer', NULL, 1, '하의', true, 20),
  ('category:하의:팬츠', 'company-sample-customer', 'category:하의', 2, '팬츠', true, 10),
  ('category:하의:팬츠:슬랙스', 'company-sample-customer', 'category:하의:팬츠', 3, '슬랙스', true, 10),
  ('category:아우터', 'company-sample-customer', NULL, 1, '아우터', true, 30),
  ('category:아우터:자켓', 'company-sample-customer', 'category:아우터', 2, '자켓', true, 10),
  ('category:아우터:자켓:테일러드', 'company-sample-customer', 'category:아우터:자켓', 3, '테일러드', true, 10);

INSERT INTO outsourcing_processes (id, company_id, company_name, name, sort_order)
VALUES
  ('process-cutting', 'company-sample-customer', '샘플 고객사', '재단', 10),
  ('process-printing', 'company-sample-customer', '샘플 고객사', '나염', 20),
  ('process-embroidery', 'company-sample-customer', '샘플 고객사', '자수', 30),
  ('process-washing', 'company-sample-customer', '샘플 고객사', '워싱', 40),
  ('process-finishing', 'company-sample-customer', '샘플 고객사', '후가공', 50);

INSERT INTO plans (
  id,
  code,
  name,
  status,
  billing_cycle,
  price_krw,
  included_storage_bytes,
  max_storage_bytes,
  allow_storage_override,
  included_members,
  max_members,
  allow_member_override,
  workorder_limit_enabled,
  inventory_enabled,
  system_stats_enabled,
  advanced_stats_enabled,
  invitation_enabled,
  storage_management_enabled,
  memo
)
VALUES
  (
    'plan-starter',
    'starter',
    'Starter',
    'draft',
    'monthly',
    29000,
    5368709120,
    53687091200,
    true,
    3,
    15,
    true,
    false,
    true,
    false,
    false,
    true,
    true,
    '초기 소규모 고객사 기준 요금제 초안'
  ),
  (
    'plan-team',
    'team',
    'Team',
    'draft',
    'monthly',
    79000,
    53687091200,
    214748364800,
    true,
    15,
    50,
    true,
    false,
    true,
    false,
    true,
    true,
    true,
    '팀 단위 운영 고객사 기준 요금제 초안'
  ),
  (
    'plan-business',
    'business',
    'Business',
    'draft',
    'monthly',
    199000,
    214748364800,
    NULL,
    true,
    50,
    NULL,
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    '대용량/다인원 고객사 기준 요금제 초안'
  );

INSERT INTO company_plan_assignments (
  id,
  company_id,
  plan_id,
  status,
  starts_at
)
VALUES (
  'company-plan-sample-team',
  'company-sample-customer',
  'plan-team',
  'active',
  now()
);

INSERT INTO storage_usage_snapshots (
  id,
  company_id,
  used_bytes,
  attachment_count,
  source,
  memo
)
VALUES (
  'storage-snapshot-sample-initial',
  'company-sample-customer',
  0,
  0,
  'db_attachment_metadata',
  'full reset 초기 snapshot'
);


-- =========================================
-- 13.5) ACCESS / INVITATION BASELINE CONSOLIDATION
-- Integrated from 0.10.52 and 0.10.76 patch SQL.
-- full_reset.sql should now be enough for the current invitation/member/permission baseline.
-- =========================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS auth_provider text,
  ADD COLUMN IF NOT EXISTS provider_user_id text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'pending', 'suspended', 'deleted'));

CREATE UNIQUE INDEX IF NOT EXISTS users_provider_identity_unique
  ON users (auth_provider, provider_user_id)
  WHERE auth_provider IS NOT NULL
    AND provider_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_status_idx
  ON users (status, created_at DESC);

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS plan_code text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_status_check;

ALTER TABLE companies
  ADD CONSTRAINT companies_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'closed'));

CREATE INDEX IF NOT EXISTS companies_status_idx
  ON companies (status, created_at DESC);

CREATE TABLE company_members (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  role_template_code text,
  display_name text,
  approved_by text REFERENCES users(id),
  approved_at timestamptz,
  rejected_by text REFERENCES users(id),
  rejected_at timestamptz,
  suspended_by text REFERENCES users(id),
  suspended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_members_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  CONSTRAINT company_members_approval_consistency
    CHECK ((status = 'approved' AND approved_at IS NOT NULL) OR status <> 'approved'),
  CONSTRAINT company_members_rejection_consistency
    CHECK ((status = 'rejected' AND rejected_at IS NOT NULL) OR status <> 'rejected'),
  CONSTRAINT company_members_suspension_consistency
    CHECK ((status = 'suspended' AND suspended_at IS NOT NULL) OR status <> 'suspended')
);

CREATE UNIQUE INDEX company_members_company_user_unique
  ON company_members (company_id, user_id);

CREATE INDEX company_members_company_status_idx
  ON company_members (company_id, status, created_at DESC);

CREATE INDEX company_members_user_idx
  ON company_members (user_id);

ALTER TABLE permission_catalog
  ADD COLUMN IF NOT EXISTS permission_group text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS label_key text,
  ADD COLUMN IF NOT EXISTS description_key text,
  ADD COLUMN IF NOT EXISTS is_system_permission boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS permission_catalog_group_sort_idx
  ON permission_catalog (permission_group, sort_order, permission_key);

INSERT INTO permission_catalog (
  permission_key,
  label,
  description,
  category,
  permission_group,
  label_key,
  description_key,
  is_system_permission,
  sort_order,
  is_active
)
VALUES
  ('workorder.read', '작업지시서 조회', '작업지시서 업무 화면과 상세를 조회할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.read.label', 'permissions.workorder.read.description', false, 10, true),
  ('workorder.create', '작업지시서 생성', '작업지시서를 생성할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.create.label', 'permissions.workorder.create.description', false, 20, true),
  ('workorder.update', '작업지시서 수정', '작업지시서 기본 정보와 생산 정보를 수정할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.update.label', 'permissions.workorder.update.description', false, 30, true),
  ('workorder.delete', '작업지시서 삭제', '작업지시서를 휴지통으로 이동할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.delete.label', 'permissions.workorder.delete.description', false, 40, true),
  ('workorder.restore', '작업지시서 복원', '삭제된 작업지시서를 복원할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.restore.label', 'permissions.workorder.restore.description', false, 50, true),
  ('workorder.status.review', '검토 상태 변경', '작업지시서 검토 요청 또는 검토 완료 상태를 처리할 수 있다.', 'workflow', 'workflow', 'permissions.workorder.statusReview.label', 'permissions.workorder.statusReview.description', false, 60, true),
  ('workorder.status.order', '발주 상태 변경', '작업지시서 발주 요청 또는 발주 완료 상태를 처리할 수 있다.', 'workflow', 'workflow', 'permissions.workorder.statusOrder.label', 'permissions.workorder.statusOrder.description', false, 70, true),
  ('workorder.status.inspect', '검수 상태 변경', '작업지시서 검수 상태를 처리할 수 있다.', 'workflow', 'workflow', 'permissions.workorder.statusInspect.label', 'permissions.workorder.statusInspect.description', false, 80, true),
  ('workorder.status.complete', '완료 상태 변경', '작업지시서를 완료 처리할 수 있다.', 'workflow', 'workflow', 'permissions.workorder.statusComplete.label', 'permissions.workorder.statusComplete.description', false, 90, true),
  ('partner.read', '협력업체 조회', '협력업체 목록과 상세 정보를 조회할 수 있다.', 'partner', 'partner', 'permissions.partner.read.label', 'permissions.partner.read.description', false, 110, true),
  ('partner.create', '협력업체 등록', '새 협력업체를 등록할 수 있다.', 'partner', 'partner', 'permissions.partner.create.label', 'permissions.partner.create.description', false, 120, true),
  ('partner.update', '협력업체 수정', '협력업체 기본 정보와 역할을 수정할 수 있다.', 'partner', 'partner', 'permissions.partner.update.label', 'permissions.partner.update.description', false, 130, true),
  ('partner.delete', '협력업체 비활성/삭제', '협력업체를 비활성화하거나 삭제 요청할 수 있다.', 'partner', 'partner', 'permissions.partner.delete.label', 'permissions.partner.delete.description', false, 140, true),
  ('partner.manage', '협력업체 통합 관리', '이전 버전에서 사용하던 협력업체 통합 관리 권한이다.', 'partner', 'partner', 'permissions.partner.manage.label', 'permissions.partner.manage.description', false, 145, true),
  ('storage.read', '저장소 조회', '저장소 사용량과 파일 목록을 조회할 수 있다.', 'storage', 'storage', 'permissions.storage.read.label', 'permissions.storage.read.description', false, 130, true),
  ('storage.delete.request', '저장소 삭제 요청', '고객관리자 삭제 요청을 생성할 수 있다.', 'storage', 'storage', 'permissions.storage.deleteRequest.label', 'permissions.storage.deleteRequest.description', false, 140, true),
  ('storage.restore', '저장소 복원', '복구 가능한 저장소 항목을 복원할 수 있다.', 'storage', 'storage', 'permissions.storage.restore.label', 'permissions.storage.restore.description', false, 150, true),
  ('stats.read', '통계 조회', '고객사 통계 화면을 조회할 수 있다.', 'stats', 'stats', 'permissions.stats.read.label', 'permissions.stats.read.description', false, 160, true),
  ('settings.read', '조직 설정 조회', '고객사 환경설정을 조회할 수 있다.', 'settings', 'settings', 'permissions.settings.read.label', 'permissions.settings.read.description', false, 170, true),
  ('settings.manage', '조직 설정 관리', '고객사 환경설정을 수정할 수 있다.', 'settings', 'settings', 'permissions.settings.manage.label', 'permissions.settings.manage.description', false, 180, true),
  ('standards.read', '기준정보 조회', '고객사 기준정보를 조회할 수 있다.', 'standards', 'standards', 'permissions.standards.read.label', 'permissions.standards.read.description', false, 190, true),
  ('standards.create', '기준정보 등록', '고객사 기준정보를 등록할 수 있다.', 'standards', 'standards', 'permissions.standards.create.label', 'permissions.standards.create.description', false, 200, true),
  ('standards.update', '기준정보 수정', '고객사 기준정보를 수정할 수 있다.', 'standards', 'standards', 'permissions.standards.update.label', 'permissions.standards.update.description', false, 210, true),
  ('standards.delete', '기준정보 삭제/비활성', '고객사 기준정보를 삭제하거나 비활성 처리할 수 있다.', 'standards', 'standards', 'permissions.standards.delete.label', 'permissions.standards.delete.description', false, 220, true),
  ('standards.manage', '기준정보 통합 관리', '이전 버전에서 사용하던 기준정보 통합 관리 권한이다.', 'standards', 'standards', 'permissions.standards.manage.label', 'permissions.standards.manage.description', false, 225, true),
  ('member.read', '멤버 조회', '고객사 멤버 목록과 가입 신청을 조회할 수 있다.', 'member', 'member', 'permissions.member.read.label', 'permissions.member.read.description', false, 200, true),
  ('member.invite', '멤버 초대', '내부 멤버 초대 링크와 QR을 생성할 수 있다.', 'member', 'member', 'permissions.member.invite.label', 'permissions.member.invite.description', false, 210, true),
  ('member.approve', '멤버 승인', '가입 신청자를 승인할 수 있다.', 'member', 'member', 'permissions.member.approve.label', 'permissions.member.approve.description', false, 220, true),
  ('member.reject', '멤버 거절', '가입 신청자를 거절할 수 있다.', 'member', 'member', 'permissions.member.reject.label', 'permissions.member.reject.description', false, 230, true),
  ('member.permission.update', '멤버 권한 수정', '멤버에게 권한 코드를 직접 부여하거나 제거할 수 있다.', 'member', 'member', 'permissions.member.permissionUpdate.label', 'permissions.member.permissionUpdate.description', false, 240, true),
  ('member.suspend', '멤버 정지', '승인된 멤버를 정지할 수 있다.', 'member', 'member', 'permissions.member.suspend.label', 'permissions.member.suspend.description', false, 250, true),
  ('audit.read.company', '고객사 감사 로그 조회', '고객사 범위의 감사 로그를 조회할 수 있다.', 'audit', 'audit', 'permissions.audit.readCompany.label', 'permissions.audit.readCompany.description', false, 260, true),
  ('personal_settings.manage', '개인 설정 관리', '본인 언어, 테마 등 개인 설정을 수정할 수 있다.', 'personal', 'personal', 'permissions.personalSettings.manage.label', 'permissions.personalSettings.manage.description', false, 270, true),
  ('system.standard.manage', '시스템 기준정보 관리', '시스템관리자 기준정보 원장을 관리할 수 있다.', 'system', 'system', 'permissions.system.standardManage.label', 'permissions.system.standardManage.description', true, 1000, true),
  ('system.company.invite', '시스템 고객사 초대', '시스템관리자가 고객사 초대 링크와 QR을 생성할 수 있다.', 'system', 'system', 'permissions.system.companyInvite.label', 'permissions.system.companyInvite.description', true, 1010, true),
  ('system.company.approve', '시스템 고객사 승인', '시스템관리자가 고객사 가입 신청을 승인하고 고객사를 생성할 수 있다.', 'system', 'system', 'permissions.system.companyApprove.label', 'permissions.system.companyApprove.description', true, 1020, true)
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  permission_group = EXCLUDED.permission_group,
  label_key = EXCLUDED.label_key,
  description_key = EXCLUDED.description_key,
  is_system_permission = EXCLUDED.is_system_permission,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

CREATE TABLE role_templates (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text REFERENCES companies(id) ON DELETE CASCADE,
  role_code text NOT NULL,
  role_name text NOT NULL,
  description text,
  is_system_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_templates_code_not_empty CHECK (length(trim(role_code)) > 0),
  CONSTRAINT role_templates_name_not_empty CHECK (length(trim(role_name)) > 0)
);

CREATE UNIQUE INDEX role_templates_system_code_unique
  ON role_templates (role_code)
  WHERE company_id IS NULL;

CREATE UNIQUE INDEX role_templates_company_code_unique
  ON role_templates (company_id, role_code)
  WHERE company_id IS NOT NULL;

CREATE INDEX role_templates_company_active_idx
  ON role_templates (company_id, is_active, sort_order, role_name);

CREATE TABLE role_template_permissions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role_template_id text NOT NULL REFERENCES role_templates(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_template_permissions_unique UNIQUE (role_template_id, permission_code)
);

CREATE INDEX role_template_permissions_permission_idx
  ON role_template_permissions (permission_code);

INSERT INTO role_templates (id, company_id, role_code, role_name, description, is_system_default, sort_order, is_active)
VALUES
  ('role-template-company-admin', NULL, 'company_admin', '고객관리자', '고객사 운영과 멤버 권한을 관리하는 기본 권한 묶음', true, 10, true),
  ('role-template-designer', NULL, 'designer', '디자이너', '작업지시서 작성과 디자인 첨부 중심 권한 묶음', true, 20, true),
  ('role-template-inspector', NULL, 'inspector', '검수담당자', '검수 상태 변경과 작업 확인 중심 권한 묶음', true, 30, true),
  ('role-template-inventory-manager', NULL, 'inventory_manager', '재고/자재담당자', '생산 구성과 자재 확인 중심 권한 묶음', true, 40, true),
  ('role-template-viewer', NULL, 'viewer', '조회전용', '업무 화면을 읽기 중심으로 확인하는 권한 묶음', true, 50, true)
ON CONFLICT (id) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  is_system_default = EXCLUDED.is_system_default,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO role_template_permissions (role_template_id, permission_code, is_enabled)
VALUES
  ('role-template-company-admin', 'workorder.read', true),
  ('role-template-company-admin', 'workorder.create', true),
  ('role-template-company-admin', 'workorder.update', true),
  ('role-template-company-admin', 'workorder.delete', true),
  ('role-template-company-admin', 'workorder.restore', true),
  ('role-template-company-admin', 'workorder.status.review', true),
  ('role-template-company-admin', 'workorder.status.order', true),
  ('role-template-company-admin', 'workorder.status.inspect', true),
  ('role-template-company-admin', 'workorder.status.complete', true),
  ('role-template-company-admin', 'partner.read', true),
  ('role-template-company-admin', 'partner.create', true),
  ('role-template-company-admin', 'partner.update', true),
  ('role-template-company-admin', 'partner.delete', true),
  ('role-template-company-admin', 'partner.manage', true),
  ('role-template-company-admin', 'storage.read', true),
  ('role-template-company-admin', 'storage.delete.request', true),
  ('role-template-company-admin', 'storage.restore', true),
  ('role-template-company-admin', 'stats.read', true),
  ('role-template-company-admin', 'settings.read', true),
  ('role-template-company-admin', 'settings.manage', true),
  ('role-template-company-admin', 'standards.read', true),
  ('role-template-company-admin', 'standards.create', true),
  ('role-template-company-admin', 'standards.update', true),
  ('role-template-company-admin', 'standards.delete', true),
  ('role-template-company-admin', 'standards.manage', true),
  ('role-template-company-admin', 'member.read', true),
  ('role-template-company-admin', 'member.invite', true),
  ('role-template-company-admin', 'member.approve', true),
  ('role-template-company-admin', 'member.reject', true),
  ('role-template-company-admin', 'member.permission.update', true),
  ('role-template-company-admin', 'member.suspend', true),
  ('role-template-company-admin', 'audit.read.company', true),
  ('role-template-company-admin', 'personal_settings.manage', true),
  ('role-template-designer', 'workorder.read', true),
  ('role-template-designer', 'workorder.create', true),
  ('role-template-designer', 'workorder.update', true),
  ('role-template-designer', 'workorder.status.review', true),
  ('role-template-designer', 'workorder.status.order', true),
  ('role-template-designer', 'partner.read', true),
  ('role-template-designer', 'partner.create', true),
  ('role-template-designer', 'partner.update', true),
  ('role-template-designer', 'standards.read', true),
  ('role-template-designer', 'standards.create', true),
  ('role-template-designer', 'standards.update', true),
  ('role-template-designer', 'storage.read', true),
  ('role-template-designer', 'personal_settings.manage', true),
  ('role-template-inspector', 'workorder.read', true),
  ('role-template-inspector', 'workorder.status.inspect', true),
  ('role-template-inspector', 'workorder.status.complete', true),
  ('role-template-inspector', 'partner.read', true),
  ('role-template-inspector', 'standards.read', true),
  ('role-template-inspector', 'personal_settings.manage', true),
  ('role-template-inventory-manager', 'workorder.read', true),
  ('role-template-inventory-manager', 'workorder.update', true),
  ('role-template-inventory-manager', 'workorder.status.order', true),
  ('role-template-inventory-manager', 'partner.read', true),
  ('role-template-inventory-manager', 'partner.create', true),
  ('role-template-inventory-manager', 'partner.update', true),
  ('role-template-inventory-manager', 'standards.read', true),
  ('role-template-inventory-manager', 'standards.create', true),
  ('role-template-inventory-manager', 'standards.update', true),
  ('role-template-inventory-manager', 'storage.read', true),
  ('role-template-inventory-manager', 'personal_settings.manage', true),
  ('role-template-viewer', 'workorder.read', true),
  ('role-template-viewer', 'partner.read', true),
  ('role-template-viewer', 'standards.read', true),
  ('role-template-viewer', 'storage.read', true),
  ('role-template-viewer', 'stats.read', true),
  ('role-template-viewer', 'personal_settings.manage', true)
ON CONFLICT (role_template_id, permission_code) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

CREATE TABLE member_permissions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_member_id text NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  granted_by text REFERENCES users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_permissions_unique UNIQUE (company_member_id, permission_code)
);

CREATE INDEX member_permissions_permission_idx
  ON member_permissions (permission_code);

ALTER TABLE invitations
  ALTER COLUMN company_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS invitation_type text,
  ADD COLUMN IF NOT EXISTS invited_email text,
  ADD COLUMN IF NOT EXISTS invited_phone text,
  ADD COLUMN IF NOT EXISTS target_role_template_code text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by_user_id text REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS cancelled_by_system_user_id text REFERENCES system_users(id),
  ADD COLUMN IF NOT EXISTS memo text;

UPDATE invitations
   SET invitation_type = CASE
     WHEN scope = 'system_to_company_admin' THEN 'company'
     ELSE 'member'
   END
 WHERE invitation_type IS NULL;

UPDATE invitations
   SET invited_email = recipient_email
 WHERE invited_email IS NULL
   AND recipient_email IS NOT NULL;

ALTER TABLE invitations
  ALTER COLUMN invitation_type SET NOT NULL,
  ALTER COLUMN invitation_type SET DEFAULT 'member';

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_type_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_type_check
  CHECK (invitation_type IN ('company', 'member'));

CREATE INDEX IF NOT EXISTS invitations_type_status_idx
  ON invitations (invitation_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS invitations_invited_email_idx
  ON invitations (lower(invited_email));

CREATE TABLE join_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invitation_id text REFERENCES invitations(id) ON DELETE SET NULL,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  applicant_email text NOT NULL,
  request_type text NOT NULL,
  requested_company_name text,
  business_name text,
  applicant_name text,
  applicant_phone text,
  google_sub text,
  google_picture_url text,
  request_memo text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by_user_id text REFERENCES users(id),
  reviewed_by_system_user_id text REFERENCES system_users(id),
  reviewed_at timestamptz,
  created_company_id text REFERENCES companies(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT join_requests_type_check
    CHECK (request_type IN ('company', 'member')),
  CONSTRAINT join_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT join_requests_applicant_email_not_empty
    CHECK (length(trim(applicant_email)) > 0),
  CONSTRAINT join_requests_review_consistency
    CHECK ((status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL) OR status NOT IN ('approved', 'rejected'))
);

CREATE INDEX join_requests_invitation_idx
  ON join_requests (invitation_id);

CREATE INDEX join_requests_user_idx
  ON join_requests (user_id);

CREATE INDEX join_requests_type_status_idx
  ON join_requests (request_type, status, created_at DESC);

CREATE INDEX join_requests_created_company_idx
  ON join_requests (created_company_id);

CREATE UNIQUE INDEX join_requests_pending_invitation_user_unique
  ON join_requests (invitation_id, user_id)
  WHERE status = 'pending'
    AND invitation_id IS NOT NULL
    AND user_id IS NOT NULL;

CREATE UNIQUE INDEX join_requests_pending_invitation_email_unique
  ON join_requests (invitation_id, lower(applicant_email))
  WHERE status = 'pending'
    AND invitation_id IS NOT NULL;

COMMENT ON TABLE company_members IS
'승인 기반 고객사 멤버십 테이블. 기존 company_users와 별개로 초대/가입/권한 직접 부여 흐름의 기준 테이블로 사용한다.';

COMMENT ON TABLE member_permissions IS
'승인된 company_members 기준의 permission_code 직접 부여 테이블. role template은 기본값일 뿐 실제 접근 제어는 이 테이블 기준으로 확장한다.';

COMMENT ON TABLE role_templates IS
'역할 enum이 아니라 기본 권한 묶음 템플릿. 고객사별 커스텀 템플릿은 company_id를 채운다.';

COMMENT ON TABLE join_requests IS
'초대 링크/QR 접속 후 가입 신청과 승인 대기 상태를 관리하는 테이블. OAuth 연결 전 테스트 단계에서는 user_id 없이 applicant_email 기준으로 pending 신청을 저장할 수 있다.';

COMMENT ON COLUMN invitations.company_id IS
'고객관리자 내부 멤버 초대는 고객사 ID를 가진다. 시스템관리자 고객사 초대는 승인 전 회사가 없을 수 있으므로 NULL을 허용한다.';

COMMENT ON COLUMN invitations.token_hash IS
'초대 raw token의 SHA-256 hash. raw token은 생성 응답에서 한 번만 반환하고 DB에는 저장하지 않는다.';

COMMENT ON COLUMN permission_catalog.permission_key IS
'기존 물리 컬럼명. 0.10.52 이후 도메인 용어는 permission_code로 통일하고 이 값을 permission_code로 매핑한다.';

-- =========================================
-- 14) INDEXES
-- =========================================

CREATE INDEX companies_active_name_idx ON companies (is_active, name);
CREATE INDEX company_settings_company_idx ON company_settings (company_id);
CREATE UNIQUE INDEX users_company_email_unique ON users (company_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX users_company_active_idx ON users (company_id, is_active, role, name);

CREATE INDEX company_users_company_id_idx ON company_users (company_id);
CREATE INDEX company_users_user_id_idx ON company_users (user_id);
CREATE INDEX company_users_role_idx ON company_users (role);
CREATE INDEX role_permissions_permission_key_idx ON role_permissions (permission_key);
CREATE INDEX company_user_permissions_permission_key_idx ON company_user_permissions (permission_key);
CREATE UNIQUE INDEX system_users_email_unique_idx ON system_users (lower(email));

CREATE INDEX system_unit_standards_active_idx ON system_unit_standards (is_active, sort_order, korean_name);
CREATE INDEX company_enabled_unit_standards_company_idx ON company_enabled_unit_standards (company_id, is_enabled, sort_order);
CREATE INDEX system_outsourcing_process_standards_active_idx ON system_outsourcing_process_standards (is_active, sort_order, name);
CREATE INDEX company_enabled_process_standards_company_idx ON company_enabled_process_standards (company_id, is_enabled, sort_order);
CREATE INDEX system_product_type_templates_active_idx ON system_product_type_templates (is_active, is_default, sort_order, name);
CREATE INDEX system_product_type_template_categories_template_idx ON system_product_type_template_categories (template_id, level, parent_id, sort_order, name);
CREATE INDEX units_company_active_idx ON units (company_id, is_active, sort_order, name);
CREATE INDEX units_active_idx ON units (is_active, sort_order, name);
CREATE INDEX item_categories_company_level_idx ON item_categories (company_id, level, sort_order, name);
CREATE INDEX item_categories_parent_idx ON item_categories (parent_id, sort_order, name);

CREATE INDEX partners_active_name_idx ON partners (is_active, name);
CREATE INDEX outsourcing_processes_company_active_idx ON outsourcing_processes (company_id, is_active, sort_order, name);
CREATE INDEX partners_company_idx ON partners (company_id);
CREATE INDEX partner_items_partner_id_idx ON partner_items (partner_id);
CREATE INDEX partner_items_type_active_idx ON partner_items (item_type, is_active);
CREATE INDEX partner_items_outsourcing_process_id_idx ON partner_items (outsourcing_process_id);
CREATE INDEX partner_items_company_type_active_idx ON partner_items (company_id, item_type, is_active);

CREATE INDEX spec_sheets_updated_at_idx ON spec_sheets (updated_at DESC, created_at DESC);
CREATE INDEX spec_sheets_reorder_group_idx ON spec_sheets (reorder_group_id, reorder_round);
CREATE INDEX spec_sheets_active_idx ON spec_sheets (is_active, updated_at DESC);
CREATE INDEX spec_sheets_parent_idx ON spec_sheets (parent_spec_sheet_id);
CREATE INDEX spec_sheets_category1_idx ON spec_sheets (company_id, category1_id);
CREATE INDEX spec_sheets_category2_idx ON spec_sheets (company_id, category2_id);
CREATE INDEX spec_sheets_category3_idx ON spec_sheets (company_id, category3_id);
CREATE INDEX spec_sheets_company_due_date_idx ON spec_sheets (company_id, due_date);
CREATE INDEX spec_sheets_company_manager_idx ON spec_sheets (company_id, manager_id);
CREATE INDEX spec_sheets_company_status_updated_idx ON spec_sheets (company_id, status, updated_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX idx_spec_sheets_company_active_status_updated ON spec_sheets (company_id, is_active, status, updated_at DESC, created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_spec_sheets_company_active_status_due_date ON spec_sheets (company_id, is_active, status, due_date ASC, updated_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_spec_sheets_company_active_title ON spec_sheets (company_id, is_active, lower(title), id DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_spec_sheets_company_active_vendor ON spec_sheets (company_id, is_active, lower(coalesce(vendor, '')), lower(title), id DESC) WHERE deleted_at IS NULL;
CREATE INDEX spec_sheets_delete_status_idx ON spec_sheets (delete_status, deleted_at DESC);
CREATE INDEX spec_sheets_purge_status_idx ON spec_sheets (purge_status, purge_requested_at DESC, purged_at DESC);
CREATE INDEX spec_sheets_delete_metadata_idx ON spec_sheets (delete_source, delete_scope, delete_parent_type, delete_parent_id);

CREATE INDEX orders_spec_sheet_idx ON orders (spec_sheet_id);
CREATE INDEX orders_company_spec_sheet_idx ON orders (company_id, spec_sheet_id);
CREATE INDEX orders_factory_partner_idx ON orders (factory_partner_id);
CREATE INDEX orders_active_idx ON orders (is_active, updated_at DESC, created_at DESC);
CREATE INDEX orders_source_order_entry_idx ON orders (source_order_entry_id);
CREATE INDEX orders_spec_sheet_active_idx ON orders (spec_sheet_id, is_active);
CREATE INDEX orders_company_status_due_idx ON orders (company_id, status, due_date) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX spec_sheet_materials_spec_sheet_idx ON spec_sheet_materials (spec_sheet_id);
CREATE INDEX spec_sheet_materials_company_spec_sheet_idx ON spec_sheet_materials (company_id, spec_sheet_id);
CREATE INDEX spec_sheet_materials_type_idx ON spec_sheet_materials (material_type);
CREATE INDEX spec_sheet_materials_active_idx ON spec_sheet_materials (is_active, updated_at DESC, created_at DESC);

CREATE INDEX material_stocks_source_spec_sheet_idx ON material_stocks (source_spec_sheet_id);
CREATE INDEX material_stocks_source_material_idx ON material_stocks (source_spec_sheet_material_id);
CREATE INDEX material_stocks_type_idx ON material_stocks (material_type);
CREATE INDEX material_stocks_active_idx ON material_stocks (is_active, updated_at DESC, created_at DESC);

CREATE INDEX spec_sheet_outsourcing_lines_spec_sheet_idx ON spec_sheet_outsourcing_lines (spec_sheet_id);
CREATE INDEX spec_sheet_outsourcing_lines_company_spec_sheet_idx ON spec_sheet_outsourcing_lines (company_id, spec_sheet_id);
CREATE INDEX spec_sheet_outsourcing_lines_process_idx ON spec_sheet_outsourcing_lines (process);
CREATE INDEX spec_sheet_outsourcing_lines_active_idx ON spec_sheet_outsourcing_lines (is_active, updated_at DESC, created_at DESC);

CREATE INDEX attachments_order_idx ON attachments (order_id);
CREATE INDEX attachments_order_type_active_idx ON attachments (order_id, type, is_active, created_at ASC);
CREATE INDEX attachments_storage_key_idx ON attachments (storage_key);
CREATE INDEX attachments_primary_design_idx ON attachments (order_id, type, is_primary) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX attachments_admin_active_list_idx ON attachments (created_at DESC) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX attachments_deleted_at_idx ON attachments(deleted_at);
CREATE INDEX attachments_purge_after_idx ON attachments(purge_after_at);
CREATE INDEX attachments_deleted_purge_after_idx ON attachments(purge_after_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX attachments_company_active_idx ON attachments(company_id, created_at DESC) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX attachments_company_type_created_idx ON attachments (company_id, type, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE UNIQUE INDEX attachment_trash_items_pending_attachment_unique_idx ON attachment_trash_items (attachment_id) WHERE purge_status IN ('pending', 'purge_requested') AND restored_at IS NULL AND purged_at IS NULL;
CREATE INDEX attachment_trash_items_attachment_idx ON attachment_trash_items (attachment_id);
CREATE INDEX attachment_trash_items_order_idx ON attachment_trash_items (order_id);
CREATE INDEX attachment_trash_items_company_idx ON attachment_trash_items (company_id, deleted_at DESC);
CREATE INDEX attachment_trash_items_purge_idx ON attachment_trash_items (purge_status, purge_after_at);
CREATE INDEX attachment_trash_items_purge_candidate_idx ON attachment_trash_items (purge_after_at ASC) WHERE restored_at IS NULL AND purged_at IS NULL AND purge_status IN ('pending', 'purge_requested');
CREATE INDEX attachment_trash_items_pending_list_idx ON attachment_trash_items (deleted_at DESC) WHERE restored_at IS NULL AND purged_at IS NULL AND purge_status = 'pending';
CREATE INDEX attachment_trash_items_admin_status_list_idx ON attachment_trash_items (purge_status, deleted_at DESC) WHERE restored_at IS NULL AND purged_at IS NULL;
CREATE INDEX attachment_trash_items_purge_retry_idx ON attachment_trash_items (purge_attempt_count, last_purge_attempt_at) WHERE purged_at IS NULL AND restored_at IS NULL;
CREATE INDEX attachment_trash_items_company_status_deleted_idx ON attachment_trash_items (company_id, purge_status, deleted_at DESC) WHERE restored_at IS NULL AND purged_at IS NULL;
CREATE INDEX attachment_trash_items_delete_metadata_idx ON attachment_trash_items (delete_source, delete_scope, delete_parent_type, delete_parent_id);

CREATE INDEX memos_order_idx ON memos (order_id);
CREATE INDEX memos_company_order_idx ON memos (company_id, order_id);
CREATE INDEX memos_parent_idx ON memos (parent_id);
CREATE INDEX memos_order_active_idx ON memos (order_id, is_active, created_at ASC);
CREATE INDEX memos_delete_status_idx ON memos (delete_status, deleted_at DESC);
CREATE INDEX memos_purge_status_idx ON memos (purge_status, purge_requested_at DESC, purged_at DESC);
CREATE INDEX memos_delete_metadata_idx ON memos (delete_source, delete_scope, delete_parent_type, delete_parent_id);

CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_company_created_idx ON audit_logs (company_id, created_at DESC);
CREATE INDEX audit_logs_company_event_idx ON audit_logs (company_id, event_type, created_at DESC);
CREATE INDEX audit_logs_target_idx ON audit_logs (target_type, target_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX audit_logs_severity_idx ON audit_logs (severity, created_at DESC);

CREATE INDEX history_logs_company_created_idx ON history_logs (company_id, created_at DESC);
CREATE INDEX history_logs_company_action_idx ON history_logs (company_id, action_type, created_at DESC);
CREATE INDEX history_logs_company_target_idx ON history_logs (company_id, target_type, target_id, created_at DESC);
CREATE INDEX history_logs_user_idx ON history_logs (user_id, created_at DESC);

CREATE INDEX material_orders_company_id_idx ON material_orders(company_id);
CREATE INDEX material_orders_vendor_partner_id_idx ON material_orders(vendor_partner_id);
CREATE INDEX material_orders_status_idx ON material_orders(status);
CREATE INDEX material_order_lines_company_id_idx ON material_order_lines(company_id);
CREATE INDEX material_order_lines_order_id_idx ON material_order_lines(material_order_id);
CREATE INDEX material_order_lines_spec_sheet_id_idx ON material_order_lines(spec_sheet_id);
CREATE INDEX material_order_lines_material_id_idx ON material_order_lines(spec_sheet_material_id);
CREATE INDEX material_order_lines_partner_item_id_idx ON material_order_lines(partner_item_id);
CREATE INDEX material_allocations_company_id_idx ON material_allocations(company_id);
CREATE INDEX material_allocations_stock_id_idx ON material_allocations(material_stock_id);
CREATE INDEX material_allocations_order_line_id_idx ON material_allocations(material_order_line_id);
CREATE INDEX material_allocations_spec_sheet_id_idx ON material_allocations(spec_sheet_id);
CREATE INDEX material_allocations_material_id_idx ON material_allocations(spec_sheet_material_id);

CREATE UNIQUE INDEX invitations_token_hash_unique_idx ON invitations (token_hash);
CREATE INDEX invitations_company_id_idx ON invitations (company_id);
CREATE INDEX invitations_status_idx ON invitations (status);
CREATE INDEX invitations_scope_idx ON invitations (scope);
CREATE INDEX invitations_recipient_email_idx ON invitations (lower(recipient_email));
CREATE INDEX invitations_expires_at_idx ON invitations (expires_at);
CREATE INDEX invitations_created_by_user_id_idx ON invitations (created_by_user_id);
CREATE INDEX invitations_created_by_system_user_id_idx ON invitations (created_by_system_user_id);
CREATE UNIQUE INDEX invitations_pending_unique_idx
  ON invitations (company_id, lower(recipient_email), recipient_role)
  WHERE status = 'pending';

CREATE UNIQUE INDEX plans_code_unique_idx ON plans (lower(code));
CREATE INDEX plans_status_idx ON plans (status);
CREATE INDEX plans_billing_cycle_idx ON plans (billing_cycle);
CREATE INDEX company_plan_assignments_company_id_idx ON company_plan_assignments (company_id);
CREATE INDEX company_plan_assignments_plan_id_idx ON company_plan_assignments (plan_id);
CREATE INDEX company_plan_assignments_status_idx ON company_plan_assignments (status);
CREATE INDEX company_plan_assignments_starts_at_idx ON company_plan_assignments (starts_at);
CREATE UNIQUE INDEX company_plan_assignments_one_active_per_company_idx
  ON company_plan_assignments (company_id)
  WHERE status = 'active';

CREATE INDEX storage_usage_snapshots_company_id_idx ON storage_usage_snapshots (company_id);
CREATE INDEX storage_usage_snapshots_measured_at_idx ON storage_usage_snapshots (measured_at DESC);
CREATE INDEX storage_usage_snapshots_company_measured_at_idx ON storage_usage_snapshots (company_id, measured_at DESC);


CREATE INDEX spec_sheets_company_created_idx ON spec_sheets (company_id, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX spec_sheets_company_status_created_idx ON spec_sheets (company_id, status, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX spec_sheets_company_reorder_created_idx ON spec_sheets (company_id, reorder_group_id, reorder_round, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX spec_sheets_company_delete_status_idx ON spec_sheets (company_id, delete_status, deleted_at DESC);

CREATE INDEX orders_company_factory_created_idx ON orders (company_id, factory_partner_id, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;
CREATE INDEX orders_company_created_idx ON orders (company_id, created_at DESC) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX attachments_company_deleted_type_idx ON attachments (company_id, deleted_at, type);
CREATE INDEX attachments_company_size_idx ON attachments (company_id, size_bytes) WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true;

CREATE INDEX company_workorder_daily_stats_company_date_idx ON company_workorder_daily_stats (company_id, stats_date DESC);
CREATE INDEX company_workorder_monthly_stats_company_month_idx ON company_workorder_monthly_stats (company_id, stats_month DESC);
CREATE INDEX company_storage_daily_stats_company_date_idx ON company_storage_daily_stats (company_id, stats_date DESC);

-- =========================================
-- 15) COMMENTS
-- =========================================

COMMENT ON TABLE invitations IS '초대 링크 기반 초대 테이블. raw token은 저장하지 않고 token_hash만 저장한다.';
COMMENT ON COLUMN invitations.token_hash IS '초대 raw token의 hash. raw token은 DB에 저장하지 않는다.';
COMMENT ON TABLE plans IS '요금제 원본 정의. 결제 자동화가 아니라 운영자가 적용할 plan 정책 기준이다.';
COMMENT ON TABLE company_plan_assignments IS '고객사별 적용 요금제. storage/member/price override를 허용한다.';
COMMENT ON TABLE storage_usage_snapshots IS '고객사별 저장공간 사용량 snapshot. 1차는 DB attachment metadata 기준 집계를 권장한다.';
COMMENT ON TABLE company_workorder_daily_stats IS '고객사별 일 단위 작업지시서/발주/메모/첨부 통계 summary table. 초기 통계 API의 선택적 캐시/집계 저장소로 사용한다.';
COMMENT ON TABLE company_workorder_monthly_stats IS '고객사별 월 단위 작업지시서 통계 summary table. stats_month는 해당 월 1일로 저장한다.';
COMMENT ON TABLE company_storage_daily_stats IS '고객사별 일 단위 저장소/휴지통/purge 통계 summary table. 실제 R2 list 조회가 아니라 DB metadata 기준 집계를 저장한다.';


CREATE INDEX IF NOT EXISTS users_google_sub_idx
  ON users (google_sub)
  WHERE google_sub IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_company_email_idx
  ON users (company_id, lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS join_requests_google_sub_idx
  ON join_requests (google_sub)
  WHERE google_sub IS NOT NULL;

COMMIT;
