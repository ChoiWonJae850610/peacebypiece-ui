-- PeaceByPiece 0.9.66
-- 요금제 / 용량 SQL 추가
--
-- 목적:
-- - 0.9.65 요금제/용량 정책 타입 설계를 기준으로 DB 구조 초안을 준비한다.
-- - 시스템관리자가 고객사별 plan, storage/member/price override를 관리할 수 있는 기반을 만든다.
-- - 저장공간 사용량은 1차로 DB attachment metadata 기준 snapshot을 저장한다.
--
-- 비목표:
-- - 결제 자동화
-- - PG 연동
-- - R2 실시간 사용량 집계
-- - 업로드 제한 정책 적용
-- - 기존 작업지시서/첨부/메모 API 변경

BEGIN;

-- ================================
-- 1. 요금제 상태 / 주기 / assignment 상태
-- ================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'plan_status'
  ) THEN
    CREATE TYPE plan_status AS ENUM (
      'draft',
      'active',
      'archived'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'billing_cycle'
  ) THEN
    CREATE TYPE billing_cycle AS ENUM (
      'monthly',
      'yearly'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'company_plan_assignment_status'
  ) THEN
    CREATE TYPE company_plan_assignment_status AS ENUM (
      'active',
      'scheduled',
      'expired'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'storage_usage_snapshot_source'
  ) THEN
    CREATE TYPE storage_usage_snapshot_source AS ENUM (
      'db_attachment_metadata',
      'r2_inventory',
      'manual'
    );
  END IF;
END $$;

-- ================================
-- 2. plans
-- ================================

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

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

  CONSTRAINT plans_code_not_empty
    CHECK (length(trim(code)) > 0),

  CONSTRAINT plans_name_not_empty
    CHECK (length(trim(name)) > 0),

  CONSTRAINT plans_price_non_negative
    CHECK (price_krw >= 0),

  CONSTRAINT plans_included_storage_non_negative
    CHECK (included_storage_bytes >= 0),

  CONSTRAINT plans_max_storage_non_negative
    CHECK (max_storage_bytes IS NULL OR max_storage_bytes >= 0),

  CONSTRAINT plans_storage_range_valid
    CHECK (max_storage_bytes IS NULL OR max_storage_bytes >= included_storage_bytes),

  CONSTRAINT plans_included_members_non_negative
    CHECK (included_members >= 0),

  CONSTRAINT plans_max_members_non_negative
    CHECK (max_members IS NULL OR max_members >= 0),

  CONSTRAINT plans_member_range_valid
    CHECK (max_members IS NULL OR max_members >= included_members)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_code_unique
  ON plans (lower(code));

CREATE INDEX IF NOT EXISTS idx_plans_status
  ON plans (status);

CREATE INDEX IF NOT EXISTS idx_plans_billing_cycle
  ON plans (billing_cycle);

-- ================================
-- 3. company_plan_assignments
-- ================================

CREATE TABLE IF NOT EXISTS company_plan_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,

  status company_plan_assignment_status NOT NULL DEFAULT 'active',

  override_storage_limit_bytes bigint,
  override_member_limit integer,
  override_price_krw integer,
  override_memo text,

  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,

  created_by_system_user_id uuid REFERENCES system_users(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT company_plan_override_storage_non_negative
    CHECK (override_storage_limit_bytes IS NULL OR override_storage_limit_bytes >= 0),

  CONSTRAINT company_plan_override_member_non_negative
    CHECK (override_member_limit IS NULL OR override_member_limit >= 0),

  CONSTRAINT company_plan_override_price_non_negative
    CHECK (override_price_krw IS NULL OR override_price_krw >= 0),

  CONSTRAINT company_plan_period_valid
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_company_plan_assignments_company_id
  ON company_plan_assignments (company_id);

CREATE INDEX IF NOT EXISTS idx_company_plan_assignments_plan_id
  ON company_plan_assignments (plan_id);

CREATE INDEX IF NOT EXISTS idx_company_plan_assignments_status
  ON company_plan_assignments (status);

CREATE INDEX IF NOT EXISTS idx_company_plan_assignments_starts_at
  ON company_plan_assignments (starts_at);

-- 고객사별 active plan은 하나만 유지한다.
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_plan_assignments_one_active_per_company
  ON company_plan_assignments (company_id)
  WHERE status = 'active';

-- ================================
-- 4. storage_usage_snapshots
-- ================================

CREATE TABLE IF NOT EXISTS storage_usage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  used_bytes bigint NOT NULL DEFAULT 0,
  attachment_count integer NOT NULL DEFAULT 0,

  source storage_usage_snapshot_source NOT NULL DEFAULT 'db_attachment_metadata',
  measured_at timestamptz NOT NULL DEFAULT now(),

  memo text,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT storage_usage_used_bytes_non_negative
    CHECK (used_bytes >= 0),

  CONSTRAINT storage_usage_attachment_count_non_negative
    CHECK (attachment_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_storage_usage_snapshots_company_id
  ON storage_usage_snapshots (company_id);

CREATE INDEX IF NOT EXISTS idx_storage_usage_snapshots_measured_at
  ON storage_usage_snapshots (measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_storage_usage_snapshots_company_measured_at
  ON storage_usage_snapshots (company_id, measured_at DESC);

-- ================================
-- 5. 최신 storage snapshot view
-- ================================

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

-- ================================
-- 6. 기본 plan seed
-- ================================

INSERT INTO plans (
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
  )
ON CONFLICT (lower(code)) DO NOTHING;

-- ================================
-- 7. 운영 주석
-- ================================

COMMENT ON TABLE plans IS
'요금제 원본 정의. 결제 자동화가 아니라 운영자가 적용할 plan 정책 기준이다.';

COMMENT ON TABLE company_plan_assignments IS
'고객사별 적용 요금제. storage/member/price override를 허용한다.';

COMMENT ON TABLE storage_usage_snapshots IS
'고객사별 저장공간 사용량 snapshot. 1차는 DB attachment metadata 기준 집계를 권장한다.';

COMMENT ON COLUMN company_plan_assignments.override_storage_limit_bytes IS
'고객사별 저장용량 override. plan.allow_storage_override 정책 확인 후 적용한다.';

COMMENT ON COLUMN company_plan_assignments.override_member_limit IS
'고객사별 멤버 수 override. plan.allow_member_override 정책 확인 후 적용한다.';

COMMENT ON COLUMN company_plan_assignments.override_price_krw IS
'고객사별 가격 override. 실제 결제 자동화와는 별도 운영 정책 값이다.';

COMMENT ON COLUMN storage_usage_snapshots.source IS
'db_attachment_metadata, r2_inventory, manual 중 집계 출처. 1차는 db_attachment_metadata를 권장한다.';

-- ================================
-- 8. 다음 단계 메모
-- ================================
--
-- 0.9.67:
-- - 시스템관리자 고객별 요금제 수정 UI skeleton 추가
-- - 고객별 plan 선택, storage/member/price override 입력 영역 준비
--
-- 0.9.68:
-- - 스토리지 사용량 집계 API skeleton 추가
-- - 1차는 DB attachment metadata 기준 집계

COMMIT;
