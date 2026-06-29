-- 0.24.26 Public Signup Consent Evidence
-- Additive migration file only. Do not execute without explicit approval.

BEGIN;

CREATE TABLE IF NOT EXISTS signup_application_consents (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id text NOT NULL REFERENCES signup_applications(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  policy_code text NOT NULL,
  policy_version text NOT NULL,
  agreed_at timestamptz NOT NULL,
  agreed_email_normalized text NOT NULL,
  agreed_google_sub text NOT NULL,
  revoked_at timestamptz,
  revoke_reason_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT signup_application_consents_type_check CHECK (
    consent_type IN ('terms_of_service', 'privacy_policy')
  ),
  CONSTRAINT signup_application_consents_policy_code_check CHECK (
    length(trim(policy_code)) > 0
  ),
  CONSTRAINT signup_application_consents_policy_version_check CHECK (
    length(trim(policy_version)) > 0
  ),
  CONSTRAINT signup_application_consents_email_normalized_check CHECK (
    agreed_email_normalized = lower(trim(agreed_email_normalized))
    AND length(agreed_email_normalized) > 0
  ),
  CONSTRAINT signup_application_consents_google_sub_check CHECK (
    length(trim(agreed_google_sub)) > 0
  ),
  CONSTRAINT signup_application_consents_revoke_check CHECK (
    (revoked_at IS NULL AND revoke_reason_code IS NULL)
    OR (revoked_at IS NOT NULL AND revoke_reason_code IS NOT NULL AND length(trim(revoke_reason_code)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS signup_application_consents_application_idx
  ON signup_application_consents (application_id, consent_type, agreed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS signup_application_consents_active_type_unique
  ON signup_application_consents (application_id, consent_type)
  WHERE revoked_at IS NULL;

COMMIT;
