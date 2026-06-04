-- 0.19.67 member lifecycle status baseline
-- Adds withdrawal request and withdrawn status support without deleting historical members.

ALTER TABLE company_members
  ADD COLUMN IF NOT EXISTS withdrawal_requested_by text REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS withdrawal_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_by text REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

ALTER TABLE company_members
  DROP CONSTRAINT IF EXISTS company_members_status_check;

ALTER TABLE company_members
  ADD CONSTRAINT company_members_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'withdrawal_requested', 'withdrawn'));

ALTER TABLE company_members
  DROP CONSTRAINT IF EXISTS company_members_withdrawal_request_consistency;

ALTER TABLE company_members
  ADD CONSTRAINT company_members_withdrawal_request_consistency
  CHECK ((status = 'withdrawal_requested' AND withdrawal_requested_at IS NOT NULL) OR status <> 'withdrawal_requested');

ALTER TABLE company_members
  DROP CONSTRAINT IF EXISTS company_members_withdrawn_consistency;

ALTER TABLE company_members
  ADD CONSTRAINT company_members_withdrawn_consistency
  CHECK ((status = 'withdrawn' AND withdrawn_at IS NOT NULL) OR status <> 'withdrawn');

CREATE INDEX IF NOT EXISTS company_members_withdrawal_status_idx
  ON company_members (company_id, status, withdrawal_requested_at DESC, withdrawn_at DESC);
