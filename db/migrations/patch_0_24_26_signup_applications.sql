-- 0.24.26 Public Signup, Verification, Approval, and Trial
-- Migration file only. Do not execute without explicit approval.

BEGIN;

CREATE TABLE IF NOT EXISTS signup_applications (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'draft',
  google_sub text NOT NULL,
  email text NOT NULL,
  email_normalized text NOT NULL,
  email_verified boolean NOT NULL,
  applicant_name text NOT NULL,
  google_picture_url text,
  requested_company_name text NOT NULL,
  business_name text NOT NULL,
  business_registration_number text NOT NULL,
  business_registration_number_normalized text NOT NULL,
  requested_plan_code text NOT NULL,
  business_validation_status text NOT NULL DEFAULT 'not_checked',
  business_validation_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  business_validation_checked_at timestamptz,
  correction_requested_at timestamptz,
  correction_due_at timestamptz,
  correction_reason text,
  correction_count integer NOT NULL DEFAULT 0,
  reviewed_by_system_user_id text REFERENCES system_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  provisioning_status text NOT NULL DEFAULT 'not_started',
  provisioning_started_at timestamptz,
  provisioning_completed_at timestamptz,
  provisioning_error_code text,
  provisioning_attempt_count integer NOT NULL DEFAULT 0,
  created_company_id text REFERENCES companies(id) ON DELETE SET NULL,
  created_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_company_member_id text REFERENCES company_members(id) ON DELETE SET NULL,
  created_subscription_id text REFERENCES company_subscriptions(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT signup_applications_status_check CHECK (
    status IN (
      'draft',
      'submitted',
      'reviewing',
      'changes_requested',
      'approved',
      'rejected',
      'canceled',
      'provisioning_failed'
    )
  ),
  CONSTRAINT signup_applications_plan_code_check CHECK (
    requested_plan_code IN ('lite', 'flow', 'studio', 'custom')
  ),
  CONSTRAINT signup_applications_email_verified_check CHECK (email_verified = true),
  CONSTRAINT signup_applications_email_normalized_check CHECK (
    email = trim(email)
    AND length(email) > 0
    AND email_normalized = lower(trim(email))
    AND length(email_normalized) > 0
  ),
  CONSTRAINT signup_applications_required_identity_check CHECK (
    length(trim(google_sub)) > 0
    AND length(trim(applicant_name)) > 0
    AND length(trim(requested_company_name)) > 0
    AND length(trim(business_name)) > 0
  ),
  CONSTRAINT signup_applications_business_registration_check CHECK (
    length(trim(business_registration_number)) > 0
    AND business_registration_number_normalized = regexp_replace(business_registration_number, '[^0-9]', '', 'g')
    AND business_registration_number_normalized ~ '^[0-9]{10}$'
  ),
  CONSTRAINT signup_applications_business_validation_status_check CHECK (
    business_validation_status IN ('not_checked', 'valid', 'invalid', 'api_failed', 'manual_review')
  ),
  CONSTRAINT signup_applications_provisioning_status_check CHECK (
    provisioning_status IN ('not_started', 'in_progress', 'completed', 'failed')
  ),
  CONSTRAINT signup_applications_status_provisioning_consistency_check CHECK (
    (status IN ('draft', 'submitted', 'changes_requested', 'rejected', 'canceled') AND provisioning_status = 'not_started')
    OR (status = 'reviewing' AND provisioning_status IN ('not_started', 'in_progress'))
    OR (status = 'approved' AND provisioning_status = 'completed')
    OR (status = 'provisioning_failed' AND provisioning_status = 'failed')
  ),
  CONSTRAINT signup_applications_nonnegative_counts_check CHECK (
    correction_count >= 0 AND provisioning_attempt_count >= 0
  ),
  CONSTRAINT signup_applications_submitted_timestamp_check CHECK (
    status NOT IN ('submitted', 'reviewing', 'changes_requested', 'approved', 'rejected', 'provisioning_failed')
    OR submitted_at IS NOT NULL
  ),
  CONSTRAINT signup_applications_correction_check CHECK (
    status <> 'changes_requested'
    OR (correction_requested_at IS NOT NULL AND correction_due_at IS NOT NULL AND correction_reason IS NOT NULL)
  ),
  CONSTRAINT signup_applications_approved_check CHECK (
    status <> 'approved'
    OR (
      approved_at IS NOT NULL
      AND provisioning_status = 'completed'
      AND created_company_id IS NOT NULL
      AND created_user_id IS NOT NULL
      AND created_company_member_id IS NOT NULL
      AND created_subscription_id IS NOT NULL
    )
  ),
  CONSTRAINT signup_applications_rejected_check CHECK (
    status <> 'rejected' OR (rejected_at IS NOT NULL AND rejection_reason IS NOT NULL)
  ),
  CONSTRAINT signup_applications_canceled_check CHECK (
    status <> 'canceled' OR canceled_at IS NOT NULL
  ),
  CONSTRAINT signup_applications_provisioning_failed_check CHECK (
    status <> 'provisioning_failed'
    OR (
      provisioning_status = 'failed'
      AND provisioning_started_at IS NOT NULL
      AND provisioning_error_code IS NOT NULL
    )
  )
);

CREATE TABLE IF NOT EXISTS signup_application_files (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id text NOT NULL REFERENCES signup_applications(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  original_name text NOT NULL,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by_system_user_id text REFERENCES system_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  approved_company_file_id text REFERENCES company_files(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  CONSTRAINT signup_application_files_type_check CHECK (file_type IN ('business_registration')),
  CONSTRAINT signup_application_files_size_check CHECK (size_bytes >= 0),
  CONSTRAINT signup_application_files_original_name_check CHECK (length(trim(original_name)) > 0),
  CONSTRAINT signup_application_files_storage_key_check CHECK (length(trim(storage_key)) > 0),
  CONSTRAINT signup_application_files_mime_type_check CHECK (length(trim(mime_type)) > 0)
);

CREATE INDEX IF NOT EXISTS signup_applications_review_queue_idx
  ON signup_applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS signup_applications_correction_due_idx
  ON signup_applications (correction_due_at)
  WHERE status = 'changes_requested';

CREATE UNIQUE INDEX IF NOT EXISTS signup_applications_active_email_idx
  ON signup_applications (email_normalized)
  WHERE status IN ('submitted', 'reviewing', 'changes_requested', 'approved', 'provisioning_failed');

CREATE UNIQUE INDEX IF NOT EXISTS signup_applications_active_google_sub_idx
  ON signup_applications (google_sub)
  WHERE status IN ('submitted', 'reviewing', 'changes_requested', 'approved', 'provisioning_failed');

CREATE UNIQUE INDEX IF NOT EXISTS signup_applications_active_business_registration_idx
  ON signup_applications (business_registration_number_normalized)
  WHERE status IN ('submitted', 'reviewing', 'changes_requested', 'approved', 'provisioning_failed');

CREATE UNIQUE INDEX IF NOT EXISTS signup_applications_created_company_idx
  ON signup_applications (created_company_id)
  WHERE created_company_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS signup_applications_created_user_idx
  ON signup_applications (created_user_id)
  WHERE created_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS signup_applications_created_member_idx
  ON signup_applications (created_company_member_id)
  WHERE created_company_member_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS signup_applications_created_subscription_idx
  ON signup_applications (created_subscription_id)
  WHERE created_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS signup_application_files_application_type_active_idx
  ON signup_application_files (application_id, file_type, uploaded_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS signup_application_files_storage_key_unique
  ON signup_application_files (storage_key);

CREATE UNIQUE INDEX IF NOT EXISTS signup_application_files_active_certificate_unique
  ON signup_application_files (application_id, file_type)
  WHERE deleted_at IS NULL AND file_type = 'business_registration';

COMMIT;
