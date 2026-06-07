-- WAFL 0.20.19 - company feedback request intake

CREATE TABLE IF NOT EXISTS company_feedback_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  feedback_type text NOT NULL,
  feedback_status text NOT NULL DEFAULT 'received',
  title text NOT NULL,
  message text NOT NULL,
  source text NOT NULL DEFAULT 'admin_settings',
  reviewed_by_system_user_id text REFERENCES system_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  response_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_feedback_requests_type_check CHECK (
    feedback_type IN ('feature', 'bug', 'improvement')
  ),
  CONSTRAINT company_feedback_requests_status_check CHECK (
    feedback_status IN ('received', 'reviewing', 'answered', 'closed')
  ),
  CONSTRAINT company_feedback_requests_title_check CHECK (length(trim(title)) BETWEEN 2 AND 160),
  CONSTRAINT company_feedback_requests_message_check CHECK (length(trim(message)) BETWEEN 10 AND 2000)
);

CREATE INDEX IF NOT EXISTS company_feedback_requests_company_created_idx
  ON company_feedback_requests (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS company_feedback_requests_status_idx
  ON company_feedback_requests (feedback_status, created_at DESC);
