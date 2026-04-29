-- =========================================
-- PeaceByPiece patch 0.6.6392
-- history_logs DB schema
-- =========================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS history_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL,
  user_id text,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT history_logs_action_type_check
    CHECK (action_type IN (
      'WORKORDER_CREATED',
      'STATUS_CHANGED',
      'FILE_UPLOADED',
      'FILE_DELETED',
      'PARTNER_UPDATED',
      'SETTINGS_CHANGED'
    )),
  CONSTRAINT history_logs_target_type_check
    CHECK (target_type IN ('workorder', 'file', 'partner', 'settings'))
);

CREATE INDEX IF NOT EXISTS history_logs_company_created_idx
  ON history_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS history_logs_company_action_idx
  ON history_logs (company_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS history_logs_company_target_idx
  ON history_logs (company_id, target_type, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS history_logs_user_idx
  ON history_logs (user_id, created_at DESC);

COMMIT;
