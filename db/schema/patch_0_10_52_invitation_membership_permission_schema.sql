-- PeaceByPiece 0.10.52
-- 초대 / 가입 신청 / 승인 / 권한 직접 부여 schema
--
-- 목적:
-- - 시스템관리자 고객사 초대와 고객관리자 내부 멤버 초대를 같은 초대 구조에서 다룬다.
-- - 승인 전 사용자는 join_requests 상태로만 관리하고, 승인 후 company_members와 member_permissions를 생성한다.
-- - role은 기본 권한 묶음 또는 표시값으로만 사용하고, 실제 접근 제어는 permission_code 기준으로 확장한다.
-- - raw token은 저장하지 않고 token_hash만 저장한다.
--
-- 비목표:
-- - 실제 OAuth/세션 연결
-- - 실제 초대 생성 API 구현
-- - 이메일/SMS 자동 발송
-- - 기존 작업지시서/저장소/휴지통/R2 purge 흐름 변경

BEGIN;

-- ================================
-- 1. 기존 사용자 / 고객사 테이블 보완
-- ================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS auth_provider text,
  ADD COLUMN IF NOT EXISTS provider_user_id text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

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

-- ================================
-- 2. 승인 기반 고객사 멤버십
-- ================================

CREATE TABLE IF NOT EXISTS company_members (
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
    CHECK (
      (status = 'approved' AND approved_at IS NOT NULL)
      OR status <> 'approved'
    ),
  CONSTRAINT company_members_rejection_consistency
    CHECK (
      (status = 'rejected' AND rejected_at IS NOT NULL)
      OR status <> 'rejected'
    ),
  CONSTRAINT company_members_suspension_consistency
    CHECK (
      (status = 'suspended' AND suspended_at IS NOT NULL)
      OR status <> 'suspended'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS company_members_company_user_unique
  ON company_members (company_id, user_id);

CREATE INDEX IF NOT EXISTS company_members_company_status_idx
  ON company_members (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS company_members_user_idx
  ON company_members (user_id);

-- ================================
-- 3. permission catalog 보완
-- ================================

ALTER TABLE permission_catalog
  ADD COLUMN IF NOT EXISTS permission_group text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS label_key text,
  ADD COLUMN IF NOT EXISTS description_key text,
  ADD COLUMN IF NOT EXISTS is_system_permission boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS permission_catalog_group_sort_idx
  ON permission_catalog (permission_group, sort_order, permission_key);

-- permission_key는 기존 물리 컬럼명을 유지한다.
-- 도메인 용어는 permission_code로 통일하고, 후속 코드에서는 permission_key 값을 permission_code로 매핑한다.
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
  ('workorder.status.review', '검토 상태 변경', '작업지시서 검토 요청 또는 검토 완료 상태를 처리할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.statusReview.label', 'permissions.workorder.statusReview.description', false, 60, true),
  ('workorder.status.order', '발주 상태 변경', '작업지시서 발주 요청 또는 발주 완료 상태를 처리할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.statusOrder.label', 'permissions.workorder.statusOrder.description', false, 70, true),
  ('workorder.status.inspect', '검수 상태 변경', '작업지시서 검수 상태를 처리할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.statusInspect.label', 'permissions.workorder.statusInspect.description', false, 80, true),
  ('workorder.status.complete', '완료 상태 변경', '작업지시서를 완료 처리할 수 있다.', 'workorder', 'workorder', 'permissions.workorder.statusComplete.label', 'permissions.workorder.statusComplete.description', false, 90, true),
  ('partner.read', '협력업체 조회', '협력업체 목록과 상세 정보를 조회할 수 있다.', 'partner', 'partner', 'permissions.partner.read.label', 'permissions.partner.read.description', false, 110, true),
  ('partner.manage', '협력업체 관리', '협력업체 정보를 생성, 수정, 비활성화할 수 있다.', 'partner', 'partner', 'permissions.partner.manage.label', 'permissions.partner.manage.description', false, 120, true),
  ('storage.read', '저장소 조회', '저장소 사용량과 파일 목록을 조회할 수 있다.', 'storage', 'storage', 'permissions.storage.read.label', 'permissions.storage.read.description', false, 130, true),
  ('storage.delete.request', '저장소 삭제 요청', '고객관리자 삭제 요청을 생성할 수 있다.', 'storage', 'storage', 'permissions.storage.deleteRequest.label', 'permissions.storage.deleteRequest.description', false, 140, true),
  ('storage.restore', '저장소 복원', '복구 가능한 저장소 항목을 복원할 수 있다.', 'storage', 'storage', 'permissions.storage.restore.label', 'permissions.storage.restore.description', false, 150, true),
  ('stats.read', '통계 조회', '고객사 통계 화면을 조회할 수 있다.', 'stats', 'stats', 'permissions.stats.read.label', 'permissions.stats.read.description', false, 160, true),
  ('settings.read', '조직 설정 조회', '고객사 환경설정을 조회할 수 있다.', 'settings', 'settings', 'permissions.settings.read.label', 'permissions.settings.read.description', false, 170, true),
  ('settings.manage', '조직 설정 관리', '고객사 환경설정을 수정할 수 있다.', 'settings', 'settings', 'permissions.settings.manage.label', 'permissions.settings.manage.description', false, 180, true),
  ('standards.manage', '기준정보 관리', '고객사 기준정보를 관리할 수 있다.', 'settings', 'settings', 'permissions.standards.manage.label', 'permissions.standards.manage.description', false, 190, true),
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

-- ================================
-- 4. role template은 기본 권한 묶음으로만 사용
-- ================================

CREATE TABLE IF NOT EXISTS role_templates (
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

CREATE UNIQUE INDEX IF NOT EXISTS role_templates_system_code_unique
  ON role_templates (role_code)
  WHERE company_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS role_templates_company_code_unique
  ON role_templates (company_id, role_code)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS role_templates_company_active_idx
  ON role_templates (company_id, is_active, sort_order, role_name);

CREATE TABLE IF NOT EXISTS role_template_permissions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role_template_id text NOT NULL REFERENCES role_templates(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_template_permissions_unique UNIQUE (role_template_id, permission_code)
);

CREATE INDEX IF NOT EXISTS role_template_permissions_permission_idx
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
  ('role-template-company-admin', 'partner.manage', true),
  ('role-template-company-admin', 'storage.read', true),
  ('role-template-company-admin', 'storage.delete.request', true),
  ('role-template-company-admin', 'storage.restore', true),
  ('role-template-company-admin', 'stats.read', true),
  ('role-template-company-admin', 'settings.read', true),
  ('role-template-company-admin', 'settings.manage', true),
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
  ('role-template-designer', 'partner.read', true),
  ('role-template-designer', 'storage.read', true),
  ('role-template-designer', 'personal_settings.manage', true),
  ('role-template-inspector', 'workorder.read', true),
  ('role-template-inspector', 'workorder.status.inspect', true),
  ('role-template-inspector', 'workorder.status.complete', true),
  ('role-template-inspector', 'partner.read', true),
  ('role-template-inspector', 'personal_settings.manage', true),
  ('role-template-inventory-manager', 'workorder.read', true),
  ('role-template-inventory-manager', 'partner.read', true),
  ('role-template-inventory-manager', 'storage.read', true),
  ('role-template-inventory-manager', 'personal_settings.manage', true),
  ('role-template-viewer', 'workorder.read', true),
  ('role-template-viewer', 'partner.read', true),
  ('role-template-viewer', 'storage.read', true),
  ('role-template-viewer', 'stats.read', true),
  ('role-template-viewer', 'personal_settings.manage', true)
ON CONFLICT (role_template_id, permission_code) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

CREATE TABLE IF NOT EXISTS member_permissions (
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

CREATE INDEX IF NOT EXISTS member_permissions_permission_idx
  ON member_permissions (permission_code);

-- ================================
-- 5. 초대 테이블 보완
-- ================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'invitation_status'
  ) THEN
    CREATE TYPE invitation_status AS ENUM (
      'pending',
      'active',
      'accepted',
      'expired',
      'revoked',
      'cancelled'
    );
  END IF;
END $$;

ALTER TYPE invitation_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE invitation_status ADD VALUE IF NOT EXISTS 'cancelled';

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

-- ================================
-- 6. 가입 신청 / 승인 대기
-- ================================

CREATE TABLE IF NOT EXISTS join_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invitation_id text REFERENCES invitations(id) ON DELETE SET NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  requested_company_name text,
  applicant_name text,
  applicant_phone text,
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
  CONSTRAINT join_requests_review_consistency
    CHECK (
      (status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL)
      OR status NOT IN ('approved', 'rejected')
    )
);

CREATE INDEX IF NOT EXISTS join_requests_invitation_idx
  ON join_requests (invitation_id);

CREATE INDEX IF NOT EXISTS join_requests_user_idx
  ON join_requests (user_id);

CREATE INDEX IF NOT EXISTS join_requests_type_status_idx
  ON join_requests (request_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS join_requests_created_company_idx
  ON join_requests (created_company_id);

-- 같은 사용자가 같은 초대에 대해 pending 신청을 중복 생성하지 않는다.
CREATE UNIQUE INDEX IF NOT EXISTS join_requests_pending_invitation_user_unique
  ON join_requests (invitation_id, user_id)
  WHERE status = 'pending'
    AND invitation_id IS NOT NULL;

-- ================================
-- 7. 운영 주석
-- ================================

COMMENT ON TABLE company_members IS
'승인 기반 고객사 멤버십 테이블. 기존 company_users와 별개로 초대/가입/권한 직접 부여 흐름의 기준 테이블로 사용한다.';

COMMENT ON TABLE member_permissions IS
'승인된 company_members 기준의 permission_code 직접 부여 테이블. role template은 기본값일 뿐 실제 접근 제어는 이 테이블 기준으로 확장한다.';

COMMENT ON TABLE role_templates IS
'역할 enum이 아니라 기본 권한 묶음 템플릿. 고객사별 커스텀 템플릿은 company_id를 채운다.';

COMMENT ON TABLE join_requests IS
'초대 링크/QR 접속 후 가입 신청과 승인 대기 상태를 관리하는 테이블.';

COMMENT ON COLUMN invitations.token_hash IS
'초대 raw token의 hash. raw token은 DB에 저장하지 않는다.';

COMMENT ON COLUMN permission_catalog.permission_key IS
'기존 물리 컬럼명. 0.10.52 이후 도메인 용어는 permission_code로 통일하고 이 값을 permission_code로 매핑한다.';

COMMIT;
