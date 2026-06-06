-- WAFL 0.20.05
-- 요금제/저장공간 DB·API 1차: company_subscriptions 테이블 추가

BEGIN;

CREATE TABLE IF NOT EXISTS company_subscriptions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'trial',
  status text NOT NULL DEFAULT 'trialing',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_scheduled_at timestamptz,
  canceled_at timestamptz,
  storage_limit_bytes bigint NOT NULL DEFAULT 104857600,
  member_limit integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_subscriptions_plan_code_check CHECK (
    plan_code IN ('trial', 'lite', 'flow', 'studio', 'custom')
  ),
  CONSTRAINT company_subscriptions_status_check CHECK (
    status IN ('trialing', 'active', 'past_due', 'payment_failed', 'cancel_scheduled', 'canceled', 'suspended')
  ),
  CONSTRAINT company_subscriptions_storage_limit_check CHECK (storage_limit_bytes >= 0),
  CONSTRAINT company_subscriptions_member_limit_check CHECK (member_limit >= 0),
  CONSTRAINT company_subscriptions_trial_period_check CHECK (
    trial_ends_at IS NULL OR trial_started_at IS NULL OR trial_ends_at > trial_started_at
  ),
  CONSTRAINT company_subscriptions_current_period_check CHECK (
    current_period_ends_at IS NULL OR current_period_started_at IS NULL OR current_period_ends_at > current_period_started_at
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS company_subscriptions_company_unique
  ON company_subscriptions (company_id);
CREATE INDEX IF NOT EXISTS company_subscriptions_status_idx
  ON company_subscriptions (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS company_subscriptions_plan_code_idx
  ON company_subscriptions (plan_code, updated_at DESC);

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_subscription_status_check;
ALTER TABLE companies
  ADD CONSTRAINT companies_subscription_status_check CHECK (
    subscription_status IN ('trialing', 'trial_expired', 'active', 'past_due', 'payment_failed', 'cancel_scheduled', 'canceled', 'suspended')
  );

INSERT INTO company_subscriptions (
  company_id,
  plan_code,
  status,
  trial_started_at,
  trial_ends_at,
  storage_limit_bytes,
  member_limit,
  created_at,
  updated_at
)
SELECT
  c.id,
  CASE
    WHEN c.requested_plan_code IN ('trial', 'lite', 'flow', 'studio', 'custom') THEN c.requested_plan_code
    ELSE 'trial'
  END,
  CASE
    WHEN c.subscription_status IN ('trialing', 'active', 'past_due', 'payment_failed', 'cancel_scheduled', 'canceled', 'suspended') THEN c.subscription_status
    WHEN c.subscription_status = 'trial_expired' THEN 'past_due'
    ELSE 'trialing'
  END,
  c.trial_started_at,
  c.trial_ends_at,
  COALESCE(c.storage_limit_bytes, 104857600),
  COALESCE(c.member_limit, 3),
  now(),
  now()
FROM companies c
ON CONFLICT (company_id) DO NOTHING;

COMMIT;
