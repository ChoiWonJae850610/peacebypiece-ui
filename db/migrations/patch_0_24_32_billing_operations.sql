-- 0.24.32 PG Billing and Subscription Operations
-- Additive migration file only. Execute only through the approved dev/test migration guard.

BEGIN;

CREATE TABLE IF NOT EXISTS company_billing_customers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider_code text,
  provider_customer_reference text,
  environment text NOT NULL DEFAULT 'dev_test',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_billing_customers_environment_check CHECK (environment IN ('local', 'development', 'test', 'preview', 'production', 'dev_test')),
  CONSTRAINT company_billing_customers_provider_code_check CHECK (provider_code IS NULL OR provider_code IN ('deferred_pg', 'fake_dev_test'))
);

CREATE UNIQUE INDEX IF NOT EXISTS company_billing_customers_company_unique
  ON company_billing_customers (company_id);

CREATE TABLE IF NOT EXISTS company_payment_method_references (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id text REFERENCES signup_applications(id) ON DELETE SET NULL,
  billing_customer_id text REFERENCES company_billing_customers(id) ON DELETE SET NULL,
  provider_code text,
  provider_customer_reference text,
  payment_method_reference text,
  masked_card_display text,
  card_brand text,
  readiness_state text NOT NULL DEFAULT 'not_ready',
  verified_at timestamptz,
  revoked_at timestamptz,
  is_simulator boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'dev_test',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_payment_method_references_provider_check CHECK (provider_code IS NULL OR provider_code IN ('deferred_pg', 'fake_dev_test')),
  CONSTRAINT company_payment_method_references_readiness_check CHECK (readiness_state IN ('ready', 'not_ready', 'blocked_pending_provider', 'revoked')),
  CONSTRAINT company_payment_method_references_environment_check CHECK (environment IN ('local', 'development', 'test', 'preview', 'production', 'dev_test')),
  CONSTRAINT company_payment_method_references_no_fake_production_ready_check CHECK (
    NOT (environment = 'production' AND provider_code = 'fake_dev_test' AND readiness_state = 'ready')
  ),
  CONSTRAINT company_payment_method_references_no_raw_card_check CHECK (
    COALESCE(payment_method_reference, '') !~ '[0-9]{12,}'
    AND COALESCE(masked_card_display, '') !~ '[0-9]{12,}'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS company_payment_method_references_idempotency_unique
  ON company_payment_method_references (idempotency_key);
CREATE INDEX IF NOT EXISTS company_payment_method_references_company_active_idx
  ON company_payment_method_references (company_id, readiness_state, updated_at DESC)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS company_payment_method_references_application_idx
  ON company_payment_method_references (application_id, updated_at DESC)
  WHERE application_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_subscription_states (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id text REFERENCES company_subscriptions(id) ON DELETE SET NULL,
  selected_paid_plan_code text NOT NULL,
  current_plan_code text NOT NULL DEFAULT 'trial',
  lifecycle_state text NOT NULL DEFAULT 'pending_payment_readiness',
  billing_period_started_at timestamptz,
  billing_period_ends_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  next_charge_at timestamptz,
  next_charge_amount_krw integer NOT NULL DEFAULT 0,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancel_scheduled_at timestamptz,
  terminated_at timestamptz,
  recovery_deadline_at timestamptz,
  deletion_scheduled_at timestamptz,
  state_reason text,
  lock_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_subscription_states_plan_check CHECK (selected_paid_plan_code IN ('lite', 'flow', 'studio', 'custom') AND current_plan_code IN ('trial', 'lite', 'flow', 'studio', 'custom')),
  CONSTRAINT billing_subscription_states_lifecycle_check CHECK (
    lifecycle_state IN ('pending_payment_readiness', 'trialing', 'active', 'cancel_scheduled', 'past_due', 'restricted', 'terminated', 'recovery_window', 'deletion_scheduled', 'deleted', 'suspended_internal', 'legal_hold')
  ),
  CONSTRAINT billing_subscription_states_amount_check CHECK (next_charge_amount_krw >= 0),
  CONSTRAINT billing_subscription_states_lock_check CHECK (lock_version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscription_states_company_unique
  ON billing_subscription_states (company_id);
CREATE INDEX IF NOT EXISTS billing_subscription_states_lifecycle_idx
  ON billing_subscription_states (lifecycle_state, updated_at DESC);

CREATE TABLE IF NOT EXISTS billing_cycles (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_state_id text REFERENCES billing_subscription_states(id) ON DELETE SET NULL,
  plan_code text NOT NULL,
  period_started_at timestamptz NOT NULL,
  period_ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_cycles_plan_check CHECK (plan_code IN ('trial', 'lite', 'flow', 'studio', 'custom')),
  CONSTRAINT billing_cycles_status_check CHECK (status IN ('open', 'invoiced', 'paid', 'failed', 'canceled')),
  CONSTRAINT billing_cycles_period_check CHECK (period_ends_at > period_started_at)
);

CREATE INDEX IF NOT EXISTS billing_cycles_company_idx
  ON billing_cycles (company_id, period_started_at DESC);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  billing_cycle_id text REFERENCES billing_cycles(id) ON DELETE SET NULL,
  plan_code text NOT NULL,
  subtotal_krw integer NOT NULL,
  total_krw integer NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  vat_policy text NOT NULL DEFAULT 'vat_included',
  status text NOT NULL DEFAULT 'open',
  due_at timestamptz,
  charged_at timestamptz,
  immutable_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_invoices_plan_check CHECK (plan_code IN ('trial', 'lite', 'flow', 'studio', 'custom')),
  CONSTRAINT billing_invoices_money_check CHECK (subtotal_krw >= 0 AND total_krw >= 0 AND currency = 'KRW' AND vat_policy = 'vat_included'),
  CONSTRAINT billing_invoices_status_check CHECK (status IN ('open', 'paid', 'failed', 'void', 'refunded'))
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_invoices_idempotency_unique
  ON billing_invoices (idempotency_key);
CREATE INDEX IF NOT EXISTS billing_invoices_company_idx
  ON billing_invoices (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_invoice_lines (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id text NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  line_type text NOT NULL,
  description text NOT NULL,
  amount_krw integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_invoice_lines_type_check CHECK (line_type IN ('plan', 'storage_add_on', 'proration', 'refund_adjustment')),
  CONSTRAINT billing_invoice_lines_amount_check CHECK (amount_krw >= 0),
  CONSTRAINT billing_invoice_lines_quantity_check CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS billing_payment_attempts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id text NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  retry_day integer NOT NULL,
  amount_krw integer NOT NULL,
  result text NOT NULL DEFAULT 'pending',
  safe_failure_code text,
  provider_transaction_reference text,
  idempotency_key text NOT NULL,
  retryable boolean NOT NULL DEFAULT true,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_payment_attempts_retry_day_check CHECK (retry_day IN (0, 3, 7, 14, 21, 30)),
  CONSTRAINT billing_payment_attempts_result_check CHECK (result IN ('pending', 'succeeded', 'failed', 'skipped')),
  CONSTRAINT billing_payment_attempts_amount_check CHECK (amount_krw >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_attempts_idempotency_unique
  ON billing_payment_attempts (idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_attempts_invoice_retry_unique
  ON billing_payment_attempts (invoice_id, retry_day);

CREATE TABLE IF NOT EXISTS billing_transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_id text REFERENCES billing_invoices(id) ON DELETE SET NULL,
  payment_attempt_id text REFERENCES billing_payment_attempts(id) ON DELETE SET NULL,
  transaction_type text NOT NULL,
  amount_krw integer NOT NULL,
  status text NOT NULL,
  provider_transaction_reference text,
  approval_reference text,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_transactions_type_check CHECK (transaction_type IN ('charge', 'refund', 'adjustment')),
  CONSTRAINT billing_transactions_status_check CHECK (status IN ('succeeded', 'failed', 'pending', 'void')),
  CONSTRAINT billing_transactions_amount_check CHECK (amount_krw >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_transactions_idempotency_unique
  ON billing_transactions (idempotency_key);

CREATE TABLE IF NOT EXISTS billing_refunds (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_id text REFERENCES billing_transactions(id) ON DELETE SET NULL,
  invoice_id text REFERENCES billing_invoices(id) ON DELETE SET NULL,
  refund_type text NOT NULL,
  amount_krw integer NOT NULL,
  status text NOT NULL DEFAULT 'simulated',
  reason_code text NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_refunds_type_check CHECK (refund_type IN ('downgrade_proration', 'duplicate_payment', 'system_error', 'legal_review')),
  CONSTRAINT billing_refunds_status_check CHECK (status IN ('simulated', 'pending', 'succeeded', 'failed')),
  CONSTRAINT billing_refunds_amount_check CHECK (amount_krw >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_refunds_idempotency_unique
  ON billing_refunds (idempotency_key);

CREATE TABLE IF NOT EXISTS billing_subscription_changes (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_state_id text REFERENCES billing_subscription_states(id) ON DELETE SET NULL,
  change_type text NOT NULL,
  from_plan_code text NOT NULL,
  to_plan_code text NOT NULL,
  amount_krw integer NOT NULL DEFAULT 0,
  quote_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'simulated',
  idempotency_key text NOT NULL,
  requested_by_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  CONSTRAINT billing_subscription_changes_type_check CHECK (change_type IN ('upgrade', 'downgrade', 'cancel', 'reverse_cancel', 'recovery')),
  CONSTRAINT billing_subscription_changes_plan_check CHECK (from_plan_code IN ('trial', 'lite', 'flow', 'studio', 'custom') AND to_plan_code IN ('trial', 'lite', 'flow', 'studio', 'custom')),
  CONSTRAINT billing_subscription_changes_status_check CHECK (status IN ('simulated', 'applied', 'failed', 'conflict')),
  CONSTRAINT billing_subscription_changes_amount_check CHECK (amount_krw >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscription_changes_idempotency_unique
  ON billing_subscription_changes (idempotency_key);
CREATE INDEX IF NOT EXISTS billing_subscription_changes_company_idx
  ON billing_subscription_changes (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text REFERENCES companies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  idempotency_key text NOT NULL,
  safe_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_events_payload_no_raw_check CHECK (
    safe_payload::text !~* '(cardNumber|cvc|cvv|cardPassword|providerSecret|webhookSecret|rawProvider|authorization|signedUrl)'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_events_idempotency_unique
  ON billing_events (idempotency_key);
CREATE INDEX IF NOT EXISTS billing_events_company_idx
  ON billing_events (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_retry_schedules (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_id text NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  retry_day integer NOT NULL,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  lease_until timestamptz,
  attempt_id text REFERENCES billing_payment_attempts(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_retry_schedules_retry_day_check CHECK (retry_day IN (0, 3, 7, 14, 21, 30)),
  CONSTRAINT billing_retry_schedules_status_check CHECK (status IN ('pending', 'leased', 'completed', 'skipped', 'failed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_retry_schedules_idempotency_unique
  ON billing_retry_schedules (idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS billing_retry_schedules_invoice_day_unique
  ON billing_retry_schedules (invoice_id, retry_day);
CREATE INDEX IF NOT EXISTS billing_retry_schedules_due_idx
  ON billing_retry_schedules (status, due_at);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_code text,
  provider_event_reference text,
  event_type text NOT NULL,
  verification_state text NOT NULL DEFAULT 'interface_only',
  safe_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT billing_webhook_events_provider_check CHECK (provider_code IS NULL OR provider_code IN ('deferred_pg', 'fake_dev_test')),
  CONSTRAINT billing_webhook_events_verification_check CHECK (verification_state IN ('interface_only', 'verified', 'rejected', 'deferred')),
  CONSTRAINT billing_webhook_events_safe_summary_check CHECK (
    safe_summary::text !~* '(secret|authorization|rawProvider|cardNumber|cvc|webhookSecret)'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_webhook_events_idempotency_unique
  ON billing_webhook_events (idempotency_key);

CREATE TABLE IF NOT EXISTS billing_notification_outbox (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text REFERENCES companies(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  template_code text NOT NULL,
  recipient_scope text NOT NULL,
  safe_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  environment text NOT NULL DEFAULT 'dev_test',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_notification_outbox_template_check CHECK (
    template_code IN (
      'signup_received',
      'signup_correction_requested',
      'signup_correction_deadline',
      'signup_approved',
      'trial_started',
      'trial_ending_3d',
      'trial_ending_1d',
      'trial_conversion_success',
      'payment_failed',
      'payment_retry_scheduled',
      'restriction_started',
      'termination_warning',
      'terminated',
      'recovery_completed',
      'deletion_1d',
      'deletion_completed',
      'export_ready',
      'export_expiring'
    )
  ),
  CONSTRAINT billing_notification_outbox_scope_check CHECK (recipient_scope IN ('applicant', 'company_admin', 'system_admin')),
  CONSTRAINT billing_notification_outbox_status_check CHECK (status IN ('pending', 'sent', 'failed', 'dead_letter', 'canceled')),
  CONSTRAINT billing_notification_outbox_safe_payload_check CHECK (
    safe_payload::text !~* '(cardNumber|cvc|cvv|cardPassword|providerSecret|webhookSecret|rawProvider|rawR2Url|signedUrl|token)'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_notification_outbox_idempotency_unique
  ON billing_notification_outbox (idempotency_key);
CREATE INDEX IF NOT EXISTS billing_notification_outbox_due_idx
  ON billing_notification_outbox (status, scheduled_at);

CREATE TABLE IF NOT EXISTS company_export_jobs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by_user_id text,
  status text NOT NULL DEFAULT 'requested',
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_export_jobs_status_check CHECK (status IN ('requested', 'building', 'ready', 'failed', 'expired', 'cleanup_pending', 'cleaned')),
  CONSTRAINT company_export_jobs_manifest_safe_check CHECK (
    manifest::text !~* '(rawR2Url|signedUrl|secret|token)'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS company_export_jobs_idempotency_unique
  ON company_export_jobs (idempotency_key);
CREATE INDEX IF NOT EXISTS company_export_jobs_company_idx
  ON company_export_jobs (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS company_export_parts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  export_job_id text NOT NULL REFERENCES company_export_jobs(id) ON DELETE CASCADE,
  part_number integer NOT NULL,
  storage_key text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  checksum_sha256 text,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_export_parts_part_check CHECK (part_number > 0),
  CONSTRAINT company_export_parts_size_check CHECK (size_bytes >= 0),
  CONSTRAINT company_export_parts_status_check CHECK (status IN ('ready', 'expired', 'cleaned', 'failed')),
  CONSTRAINT company_export_parts_storage_key_check CHECK (
    storage_key LIKE 'company-exports/%'
    AND storage_key NOT LIKE '/%'
    AND storage_key NOT LIKE '%..%'
    AND storage_key NOT LIKE '%\%'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS company_export_parts_job_part_unique
  ON company_export_parts (export_job_id, part_number);
CREATE UNIQUE INDEX IF NOT EXISTS company_export_parts_storage_key_unique
  ON company_export_parts (storage_key);

CREATE TABLE IF NOT EXISTS company_termination_records (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_state_id text REFERENCES billing_subscription_states(id) ON DELETE SET NULL,
  termination_reason text NOT NULL,
  terminated_at timestamptz NOT NULL,
  recovery_deadline_at timestamptz NOT NULL,
  deletion_scheduled_at timestamptz NOT NULL,
  legal_hold boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'recovery_window',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_termination_records_status_check CHECK (status IN ('recovery_window', 'deletion_scheduled', 'deleting', 'deleted', 'deletion_failed', 'legal_hold', 'recovered')),
  CONSTRAINT company_termination_records_date_check CHECK (recovery_deadline_at > terminated_at AND deletion_scheduled_at >= recovery_deadline_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS company_termination_records_idempotency_unique
  ON company_termination_records (idempotency_key);
CREATE INDEX IF NOT EXISTS company_termination_records_due_idx
  ON company_termination_records (status, deletion_scheduled_at);

CREATE TABLE IF NOT EXISTS company_recovery_actions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  termination_record_id text REFERENCES company_termination_records(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  payment_attempt_id text REFERENCES billing_payment_attempts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  idempotency_key text NOT NULL,
  actor_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT company_recovery_actions_type_check CHECK (action_type IN ('recover', 'cancel_deletion', 'dry_run')),
  CONSTRAINT company_recovery_actions_status_check CHECK (status IN ('pending', 'succeeded', 'failed', 'skipped'))
);

CREATE UNIQUE INDEX IF NOT EXISTS company_recovery_actions_idempotency_unique
  ON company_recovery_actions (idempotency_key);

COMMIT;
