-- PeaceByPiece 0.9.60
-- invitations SQL 추가
--
-- 목적:
-- - 0.9.59 초대 정책 모델을 기준으로 초대 링크 기반 초대 테이블을 준비한다.
-- - 시스템관리자 -> 고객관리자 초대와 고객관리자 -> 고객사 멤버 초대를 같은 테이블에서 관리한다.
-- - raw token은 DB에 저장하지 않고 token_hash만 저장한다.
--
-- 비목표:
-- - 실제 이메일 발송
-- - 실제 토큰 생성 API 구현
-- - QR UI 구현
-- - 인증/회원가입 연결
-- - 기존 작업지시서/첨부/메모 흐름 변경

BEGIN;

-- ================================
-- 1. 초대 상태 / scope / role 제약 준비
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
      'accepted',
      'expired',
      'revoked'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'invitation_scope'
  ) THEN
    CREATE TYPE invitation_scope AS ENUM (
      'system_to_company_admin',
      'company_to_member'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'invitation_permission_preset'
  ) THEN
    CREATE TYPE invitation_permission_preset AS ENUM (
      'company_admin',
      'designer',
      'inspector',
      'inventory_manager',
      'viewer',
      'custom'
    );
  END IF;
END $$;

-- ================================
-- 2. invitations 테이블
-- ================================

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  scope invitation_scope NOT NULL,
  recipient_email text NOT NULL,
  recipient_role text NOT NULL,
  permission_preset invitation_permission_preset NOT NULL DEFAULT 'viewer',

  -- raw token은 DB에 저장하지 않는다.
  -- 생성 API 응답에서 raw token을 한 번만 반환하고 DB에는 hash만 저장한다.
  token_hash text NOT NULL,

  status invitation_status NOT NULL DEFAULT 'pending',

  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,

  created_by_user_id uuid REFERENCES users(id),
  created_by_system_user_id uuid REFERENCES system_users(id),

  accepted_user_id uuid REFERENCES users(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT invitations_recipient_email_not_empty
    CHECK (length(trim(recipient_email)) > 0),

  CONSTRAINT invitations_token_hash_not_empty
    CHECK (length(trim(token_hash)) > 0),

  CONSTRAINT invitations_expires_after_created
    CHECK (expires_at > created_at),

  CONSTRAINT invitations_acceptance_consistency
    CHECK (
      (status = 'accepted' AND accepted_at IS NOT NULL)
      OR (status <> 'accepted')
    ),

  CONSTRAINT invitations_revocation_consistency
    CHECK (
      (status = 'revoked' AND revoked_at IS NOT NULL)
      OR (status <> 'revoked')
    ),

  CONSTRAINT invitations_creator_consistency
    CHECK (
      (
        scope = 'system_to_company_admin'
        AND created_by_system_user_id IS NOT NULL
      )
      OR
      (
        scope = 'company_to_member'
        AND created_by_user_id IS NOT NULL
      )
    ),

  CONSTRAINT invitations_scope_role_consistency
    CHECK (
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

-- ================================
-- 3. 인덱스
-- ================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token_hash_unique
  ON invitations (token_hash);

CREATE INDEX IF NOT EXISTS idx_invitations_company_id
  ON invitations (company_id);

CREATE INDEX IF NOT EXISTS idx_invitations_status
  ON invitations (status);

CREATE INDEX IF NOT EXISTS idx_invitations_scope
  ON invitations (scope);

CREATE INDEX IF NOT EXISTS idx_invitations_recipient_email
  ON invitations (lower(recipient_email));

CREATE INDEX IF NOT EXISTS idx_invitations_expires_at
  ON invitations (expires_at);

CREATE INDEX IF NOT EXISTS idx_invitations_created_by_user_id
  ON invitations (created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_invitations_created_by_system_user_id
  ON invitations (created_by_system_user_id);

-- pending 중복 초대 방지.
-- 같은 회사, 같은 이메일, 같은 role로 아직 pending 상태인 초대는 하나만 유지한다.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_unique
  ON invitations (company_id, lower(recipient_email), recipient_role)
  WHERE status = 'pending';

-- ================================
-- 4. 만료 초대 조회 view
-- ================================

CREATE OR REPLACE VIEW expired_pending_invitations AS
SELECT *
FROM invitations
WHERE status = 'pending'
  AND expires_at <= now();

-- ================================
-- 5. 운영 주석
-- ================================

COMMENT ON TABLE invitations IS
'초대 링크 기반 초대 테이블. raw token은 저장하지 않고 token_hash만 저장한다.';

COMMENT ON COLUMN invitations.token_hash IS
'초대 raw token의 hash. raw token은 DB에 저장하지 않는다.';

COMMENT ON COLUMN invitations.scope IS
'system_to_company_admin 또는 company_to_member 초대 흐름 구분.';

COMMENT ON COLUMN invitations.permission_preset IS
'초대 수락 시 부여할 권한 preset. 개별 permission override는 별도 테이블에서 처리한다.';

COMMENT ON COLUMN invitations.created_by_user_id IS
'고객관리자가 고객사 멤버를 초대한 경우의 생성자.';

COMMENT ON COLUMN invitations.created_by_system_user_id IS
'시스템관리자가 고객관리자를 초대한 경우의 생성자.';

-- ================================
-- 6. 다음 단계 메모
-- ================================
--
-- 0.9.61:
-- - 시스템관리자 고객 초대 UI skeleton 추가
-- - 실제 이메일 발송 없이 초대 링크 생성 흐름만 화면에 준비
--
-- 0.9.62:
-- - 고객관리자 멤버 초대 UI skeleton 추가
-- - role / permission preset 선택 UI 준비
--
-- 0.9.63:
-- - 초대 링크 생성 API 추가
-- - raw token은 응답에서 한 번만 반환
-- - DB에는 token_hash만 저장

COMMIT;
