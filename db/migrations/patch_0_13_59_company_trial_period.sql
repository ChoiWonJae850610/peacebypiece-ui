-- 0.13.59
-- 고객사 승인 시점 기준 7일 무료 체험 상태와 trial plan 기준을 추가한다.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_subscription_status_check,
  DROP CONSTRAINT IF EXISTS companies_trial_period_valid;

ALTER TABLE companies
  ADD CONSTRAINT companies_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'trial_expired', 'active', 'past_due', 'canceled'));

ALTER TABLE companies
  ADD CONSTRAINT companies_trial_period_valid
  CHECK (trial_ends_at IS NULL OR trial_started_at IS NULL OR trial_ends_at > trial_started_at);

INSERT INTO plans (
  id,
  code,
  name,
  status,
  billing_cycle,
  price_krw,
  included_storage_bytes,
  max_storage_bytes,
  allow_storage_override,
  included_members,
  max_members,
  allow_member_override,
  workorder_limit_enabled,
  inventory_enabled,
  system_stats_enabled,
  advanced_stats_enabled,
  invitation_enabled,
  storage_management_enabled,
  memo
)
VALUES (
  'plan-trial',
  'trial',
  'Trial',
  'active',
  'monthly',
  0,
  1073741824,
  5368709120,
  true,
  5,
  5,
  true,
  false,
  true,
  false,
  false,
  true,
  true,
  '고객사 승인 시점부터 7일 무료 체험 기준 요금제'
)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  billing_cycle = EXCLUDED.billing_cycle,
  price_krw = EXCLUDED.price_krw,
  included_storage_bytes = EXCLUDED.included_storage_bytes,
  max_storage_bytes = EXCLUDED.max_storage_bytes,
  included_members = EXCLUDED.included_members,
  max_members = EXCLUDED.max_members,
  memo = EXCLUDED.memo,
  updated_at = now();

UPDATE companies
   SET subscription_status = CASE
         WHEN billing_status = 'trial' THEN 'trialing'
         ELSE subscription_status
       END
 WHERE subscription_status IS NULL;
