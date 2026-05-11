-- =========================================
-- PeaceByPiece patch 0.10.10
-- system audit_logs DB schema
-- =========================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id text,
  actor_role text NOT NULL,
  company_id text REFERENCES companies(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id text,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id text,
  ip_address inet,

  CONSTRAINT audit_logs_actor_role_check CHECK (
    actor_role IN ('system_admin', 'customer_admin', 'designer', 'inspector', 'factory', 'system', 'unknown')
  ),
  CONSTRAINT audit_logs_target_type_check CHECK (
    target_type IN ('company', 'member', 'invitation', 'plan', 'storage', 'work_order', 'file', 'memo', 'settings', 'auth', 'system')
  ),
  CONSTRAINT audit_logs_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT audit_logs_event_type_format_check CHECK (
    event_type ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'
  )
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx
  ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_company_created_idx
  ON audit_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_company_event_idx
  ON audit_logs (company_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_target_idx
  ON audit_logs (target_type, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx
  ON audit_logs (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_severity_idx
  ON audit_logs (severity, created_at DESC);

COMMENT ON TABLE audit_logs IS 'System-admin audit ledger for operational events separated from customer-visible history.';
COMMENT ON COLUMN audit_logs.event_type IS 'Structured domain.action code such as plan.changed or purge.failed.';
COMMENT ON COLUMN audit_logs.metadata IS 'Structured before/after values, file counts, byte sizes, error codes, or request context.';

COMMIT;
