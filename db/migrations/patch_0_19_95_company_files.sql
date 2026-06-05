-- =========================================
-- WAFL migration: company files skeleton
-- Version: 0.19.95
-- =========================================

BEGIN;

CREATE TABLE IF NOT EXISTS company_files (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  original_name text NOT NULL,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  review_status text NOT NULL DEFAULT 'pending_review',
  uploaded_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_system_user_id text REFERENCES system_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  replaced_by_file_id text REFERENCES company_files(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT company_files_type_check CHECK (
    file_type IN ('representative_image', 'business_registration')
  ),
  CONSTRAINT company_files_review_status_check CHECK (
    review_status IN ('not_required', 'pending_review', 'approved', 'rejected')
  ),
  CONSTRAINT company_files_size_check CHECK (size_bytes >= 0),
  CONSTRAINT company_files_original_name_check CHECK (length(trim(original_name)) > 0),
  CONSTRAINT company_files_storage_key_check CHECK (length(trim(storage_key)) > 0),
  CONSTRAINT company_files_mime_type_check CHECK (length(trim(mime_type)) > 0),
  CONSTRAINT company_files_rejection_reason_check CHECK (
    review_status <> 'rejected' OR length(trim(COALESCE(rejection_reason, ''))) > 0
  )
);

CREATE INDEX IF NOT EXISTS company_files_company_type_active_idx
  ON company_files (company_id, file_type, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS company_files_storage_key_unique
  ON company_files (storage_key);

CREATE INDEX IF NOT EXISTS company_files_review_status_idx
  ON company_files (review_status, created_at DESC)
  WHERE deleted_at IS NULL;

COMMIT;
