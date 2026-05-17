-- PeaceByPiece 0.13.52
-- 고객사 관리자 첫 로그인 회사정보 입력 플로우용 회사 프로필 컬럼 보강

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS english_name text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS road_address text,
  ADD COLUMN IF NOT EXISTS jibun_address text,
  ADD COLUMN IF NOT EXISTS address_detail text,
  ADD COLUMN IF NOT EXISTS address_extra text,
  ADD COLUMN IF NOT EXISTS requested_plan_code text,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'profile_required',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'companies_onboarding_status_check'
  ) THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_onboarding_status_check
      CHECK (onboarding_status IN ('profile_required', 'approval_pending', 'active'));
  END IF;
END $$;

UPDATE companies
   SET onboarding_status = CASE
         WHEN COALESCE(NULLIF(trim(name), ''), NULL) IS NOT NULL
          AND COALESCE(NULLIF(trim(business_name), ''), NULL) IS NOT NULL
          AND COALESCE(NULLIF(trim(postal_code), ''), NULL) IS NOT NULL
          AND COALESCE(NULLIF(trim(road_address), ''), NULL) IS NOT NULL
         THEN 'approval_pending'
         ELSE 'profile_required'
       END
 WHERE onboarding_status IS NULL
    OR onboarding_status = '';
