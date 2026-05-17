-- 0.13.53
-- 시스템관리자 고객사 초대는 고객사가 생성되기 전 발급되므로 invitations.company_id를 NULL 허용으로 정리한다.

ALTER TABLE invitations
  ALTER COLUMN company_id DROP NOT NULL;
