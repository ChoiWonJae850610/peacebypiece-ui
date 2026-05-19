-- =========================================
-- PeaceByPiece 0.14.2
-- 고객사 멤버 초대 링크 전용 발급 허용
--
-- 목적:
-- - 고객사 관리자가 이메일/휴대폰 대상 없이 초대 링크만 생성할 수 있도록 invitations 제약을 보정한다.
-- - 시스템관리자 고객사 초대와 고객사 멤버 초대 scope는 계속 분리한다.
-- =========================================

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_recipient_email_scope_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_recipient_email_scope_check CHECK (
    (scope = 'system_to_company_admin' AND recipient_email IS NULL)
    OR
    (scope = 'company_to_member' AND (recipient_email IS NULL OR length(trim(recipient_email)) > 0))
  );
