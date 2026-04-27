-- 0.6.633 attachment purge worker support
-- 기존 Neon DB에 purge worker 재시도/오류 추적 컬럼과 인덱스를 추가합니다.

ALTER TABLE attachment_trash_items
  ADD COLUMN IF NOT EXISTS purge_attempt_count integer NOT NULL DEFAULT 0;

ALTER TABLE attachment_trash_items
  ADD COLUMN IF NOT EXISTS last_purge_attempt_at timestamptz;

ALTER TABLE attachment_trash_items
  ADD COLUMN IF NOT EXISTS last_purge_error text;

CREATE INDEX IF NOT EXISTS attachment_trash_items_purge_retry_idx
  ON attachment_trash_items (purge_attempt_count, last_purge_attempt_at)
  WHERE purged_at IS NULL AND restored_at IS NULL;
