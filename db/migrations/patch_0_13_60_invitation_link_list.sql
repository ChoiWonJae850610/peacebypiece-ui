ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS invite_url_path text;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_invite_url_path_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_invite_url_path_check
  CHECK (invite_url_path IS NULL OR length(trim(invite_url_path)) > 0);
