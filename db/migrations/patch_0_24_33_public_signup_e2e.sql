-- 0.24.33 Public Signup End-to-End UX and System-admin Review Operations
-- Additive only: application-scoped payment readiness before company provisioning.

CREATE TABLE IF NOT EXISTS signup_payment_method_references (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id text NOT NULL REFERENCES signup_applications(id) ON DELETE CASCADE,
  provider_code text,
  provider_customer_reference text,
  payment_method_reference text,
  masked_display text,
  brand text,
  readiness_state text NOT NULL DEFAULT 'not_ready',
  verified_at timestamptz,
  revoked_at timestamptz,
  is_simulator boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'dev_test',
  created_by_system_user_id text,
  revoked_by_system_user_id text,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT signup_payment_method_references_provider_check CHECK (provider_code IS NULL OR provider_code IN ('deferred_pg', 'fake_dev_test')),
  CONSTRAINT signup_payment_method_references_readiness_check CHECK (readiness_state IN ('ready', 'not_ready', 'blocked_pending_provider', 'revoked')),
  CONSTRAINT signup_payment_method_references_environment_check CHECK (environment IN ('local', 'development', 'dev', 'test', 'demo', 'preview', 'production', 'dev_test')),
  CONSTRAINT signup_payment_method_references_no_fake_production_ready_check CHECK (
    NOT (environment = 'production' AND provider_code = 'fake_dev_test' AND readiness_state = 'ready')
  ),
  CONSTRAINT signup_payment_method_references_no_raw_card_check CHECK (
    COALESCE(payment_method_reference, '') !~ '[0-9]{12,}'
    AND COALESCE(masked_display, '') !~ '[0-9]{12,}'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS signup_payment_method_references_idempotency_unique
  ON signup_payment_method_references (idempotency_key);

CREATE INDEX IF NOT EXISTS signup_payment_method_references_application_active_idx
  ON signup_payment_method_references (application_id, readiness_state, updated_at DESC)
  WHERE revoked_at IS NULL;
