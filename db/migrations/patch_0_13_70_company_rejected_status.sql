-- 0.13.70
-- 시스템관리자 고객사 거절 상태를 보존하고 거절 고객사 접근을 차단하기 위해 rejected onboarding status를 추가한다.

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_onboarding_status_check;

ALTER TABLE companies
  ADD CONSTRAINT companies_onboarding_status_check
  CHECK (onboarding_status IN ('profile_required', 'approval_pending', 'active', 'rejected'));
