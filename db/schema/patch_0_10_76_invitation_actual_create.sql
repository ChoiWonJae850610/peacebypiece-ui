-- PeaceByPiece 0.10.76
-- 초대 생성 API 실제 저장 연결 보강
-- raw token은 DB에 저장하지 않고 token_hash만 저장한다.

ALTER TABLE invitations
  ALTER COLUMN company_id DROP NOT NULL;

COMMENT ON COLUMN invitations.company_id IS
  '고객관리자 내부 멤버 초대는 고객사 ID를 가진다. 시스템관리자 고객사 초대는 승인 전 회사가 없을 수 있으므로 NULL을 허용한다.';

COMMENT ON COLUMN invitations.token_hash IS
  '초대 raw token의 SHA-256 hash. raw token은 생성 응답에서 한 번만 반환하고 DB에는 저장하지 않는다.';
