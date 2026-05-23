ALTER TABLE spec_sheets
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by_user_id text,
  ADD COLUMN IF NOT EXISTS rejected_by_name text;
