-- 0.9.22417
-- Align spec_sheets.deleted_at with attachment_trash_items.deleted_at and attachments.deleted_at.
-- Existing timestamp-without-time-zone values are interpreted as Korea local time.

ALTER TABLE spec_sheets
  ALTER COLUMN deleted_at TYPE timestamptz
  USING CASE
    WHEN deleted_at IS NULL THEN NULL
    ELSE deleted_at AT TIME ZONE 'Asia/Seoul'
  END;
