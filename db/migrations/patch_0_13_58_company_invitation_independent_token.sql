-- 0.13.58 고객사 관리자 초대 링크를 대상 이메일/휴대폰과 분리
-- 고객사 초대(system_to_company_admin)는 company가 생성되기 전 독립 token으로 발급되므로
-- recipient_email을 필수로 요구하지 않는다. 회사 멤버 초대(company_to_member)는 기존처럼 이메일 필수다.

ALTER TABLE invitations
  ALTER COLUMN recipient_email DROP NOT NULL;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_recipient_email_not_empty;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_recipient_email_scope_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_recipient_email_scope_check CHECK (
    (scope = 'system_to_company_admin' AND (recipient_email IS NULL OR length(trim(recipient_email)) >= 0))
    OR
    (scope = 'company_to_member' AND recipient_email IS NOT NULL AND length(trim(recipient_email)) > 0)
  );
