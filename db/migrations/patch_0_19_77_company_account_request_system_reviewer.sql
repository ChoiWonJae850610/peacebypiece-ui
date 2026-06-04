-- WAFL 0.19.77
-- Company account request reviews are processed by system users, not company users.
-- Keep reviewed_by_user_id for possible customer-side review history, and add a
-- system-user reviewer column for system-admin review actions.

BEGIN;

ALTER TABLE company_account_requests
  ADD COLUMN IF NOT EXISTS reviewed_by_system_user_id text;

ALTER TABLE company_account_requests
  DROP CONSTRAINT IF EXISTS company_account_requests_reviewed_by_system_user_id_fkey;

ALTER TABLE company_account_requests
  ADD CONSTRAINT company_account_requests_reviewed_by_system_user_id_fkey
  FOREIGN KEY (reviewed_by_system_user_id)
  REFERENCES system_users(id)
  ON DELETE SET NULL;

COMMIT;
