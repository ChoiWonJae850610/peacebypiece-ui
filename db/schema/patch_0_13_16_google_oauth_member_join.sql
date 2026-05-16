-- =========================================
-- WAFL patch 0.13.16
-- Google OAuth 기반 멤버 가입 신청 준비
-- =========================================

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_sub text,
  ADD COLUMN IF NOT EXISTS google_picture_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_source text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS birthday_source text;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_google_sub_unique,
  DROP CONSTRAINT IF EXISTS users_phone_source_check,
  DROP CONSTRAINT IF EXISTS users_birthday_source_check;

ALTER TABLE users
  ADD CONSTRAINT users_google_sub_unique UNIQUE (google_sub),
  ADD CONSTRAINT users_phone_source_check CHECK (phone_source IS NULL OR phone_source IN ('google', 'user', 'invitation')),
  ADD CONSTRAINT users_birthday_source_check CHECK (birthday_source IS NULL OR birthday_source IN ('user'));

CREATE INDEX IF NOT EXISTS users_google_sub_idx
  ON users (google_sub)
  WHERE google_sub IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_company_email_idx
  ON users (company_id, lower(email))
  WHERE email IS NOT NULL;

ALTER TABLE join_requests
  ADD COLUMN IF NOT EXISTS google_sub text,
  ADD COLUMN IF NOT EXISTS google_picture_url text;

CREATE INDEX IF NOT EXISTS join_requests_google_sub_idx
  ON join_requests (google_sub)
  WHERE google_sub IS NOT NULL;

COMMIT;
