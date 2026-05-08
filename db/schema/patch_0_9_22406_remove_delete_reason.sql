-- 0.9.22406
-- delete_reason 컬럼 제거 및 삭제 상태 메타데이터 단일화

ALTER TABLE IF EXISTS attachments
  DROP COLUMN IF EXISTS delete_reason;

ALTER TABLE IF EXISTS attachment_trash_items
  DROP COLUMN IF EXISTS delete_reason;

ALTER TABLE IF EXISTS memos
  DROP COLUMN IF EXISTS delete_reason;

ALTER TABLE IF EXISTS spec_sheets
  DROP COLUMN IF EXISTS delete_reason;
