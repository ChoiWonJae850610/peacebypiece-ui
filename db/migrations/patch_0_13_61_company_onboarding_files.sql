-- 0.13.61
-- 고객사 온보딩 로고/사업자등록증 업로드 metadata 테이블을 추가한다.
-- R2 object key는 다음 규칙을 사용한다.
-- - companies/{companyId}/onboarding/logo/{fileId}.{ext}
-- - companies/{companyId}/onboarding/business-license/{fileId}.{ext}

CREATE TABLE IF NOT EXISTS company_onboarding_files (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  original_name text NOT NULL,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  uploaded_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT company_onboarding_files_type_check CHECK (
    file_type IN ('logo', 'business_license')
  ),
  CONSTRAINT company_onboarding_files_size_check CHECK (size_bytes >= 0),
  CONSTRAINT company_onboarding_files_original_name_check CHECK (length(trim(original_name)) > 0),
  CONSTRAINT company_onboarding_files_storage_key_check CHECK (length(trim(storage_key)) > 0),
  CONSTRAINT company_onboarding_files_mime_type_check CHECK (length(trim(mime_type)) > 0)
);

CREATE INDEX IF NOT EXISTS company_onboarding_files_company_type_active_idx
  ON company_onboarding_files (company_id, file_type, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS company_onboarding_files_storage_key_unique
  ON company_onboarding_files (storage_key);
