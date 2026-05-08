-- 0.9.22399 삭제 상태 메타데이터 구조화 1차
-- 기존 delete_reason은 legacy fallback으로 유지한다.

ALTER TABLE spec_sheets
  ADD COLUMN IF NOT EXISTS purge_requested_by text,
  ADD COLUMN IF NOT EXISTS delete_source text,
  ADD COLUMN IF NOT EXISTS delete_scope text,
  ADD COLUMN IF NOT EXISTS delete_parent_type text,
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text;

ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS delete_source text,
  ADD COLUMN IF NOT EXISTS delete_scope text,
  ADD COLUMN IF NOT EXISTS delete_parent_type text,
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text;

ALTER TABLE attachment_trash_items
  ADD COLUMN IF NOT EXISTS delete_source text,
  ADD COLUMN IF NOT EXISTS delete_scope text,
  ADD COLUMN IF NOT EXISTS delete_parent_type text,
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text,
  ADD COLUMN IF NOT EXISTS purge_requested_by text,
  ADD COLUMN IF NOT EXISTS purge_failure_code text;

ALTER TABLE memos
  ADD COLUMN IF NOT EXISTS purge_requested_by text,
  ADD COLUMN IF NOT EXISTS delete_source text,
  ADD COLUMN IF NOT EXISTS delete_scope text,
  ADD COLUMN IF NOT EXISTS delete_parent_type text,
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text;

ALTER TABLE spec_sheets DROP CONSTRAINT IF EXISTS spec_sheets_purge_status_check;
ALTER TABLE spec_sheets ADD CONSTRAINT spec_sheets_purge_status_check
  CHECK (purge_status IN ('none', 'pending', 'purge_requested', 'processing', 'purged', 'failed', 'restored'));

ALTER TABLE attachment_trash_items DROP CONSTRAINT IF EXISTS attachment_trash_items_purge_status_check;
ALTER TABLE attachment_trash_items ADD CONSTRAINT attachment_trash_items_purge_status_check
  CHECK (purge_status IN ('pending', 'restored', 'purge_requested', 'processing', 'purged', 'failed'));

ALTER TABLE memos DROP CONSTRAINT IF EXISTS memos_purge_status_check;
ALTER TABLE memos ADD CONSTRAINT memos_purge_status_check
  CHECK (purge_status IN ('none', 'pending', 'purge_requested', 'processing', 'purged', 'failed', 'restored'));

ALTER TABLE spec_sheets DROP CONSTRAINT IF EXISTS spec_sheets_delete_source_check;
ALTER TABLE spec_sheets ADD CONSTRAINT spec_sheets_delete_source_check
  CHECK (delete_source IS NULL OR delete_source IN ('manual', 'workorder_bundle', 'system'));
ALTER TABLE spec_sheets DROP CONSTRAINT IF EXISTS spec_sheets_delete_scope_check;
ALTER TABLE spec_sheets ADD CONSTRAINT spec_sheets_delete_scope_check
  CHECK (delete_scope IS NULL OR delete_scope IN ('single', 'bundle'));
ALTER TABLE spec_sheets DROP CONSTRAINT IF EXISTS spec_sheets_delete_parent_type_check;
ALTER TABLE spec_sheets ADD CONSTRAINT spec_sheets_delete_parent_type_check
  CHECK (delete_parent_type IS NULL OR delete_parent_type IN ('none', 'workorder'));

ALTER TABLE attachment_trash_items DROP CONSTRAINT IF EXISTS attachment_trash_items_delete_source_check;
ALTER TABLE attachment_trash_items ADD CONSTRAINT attachment_trash_items_delete_source_check
  CHECK (delete_source IS NULL OR delete_source IN ('manual', 'workorder_bundle', 'system'));
ALTER TABLE attachment_trash_items DROP CONSTRAINT IF EXISTS attachment_trash_items_delete_scope_check;
ALTER TABLE attachment_trash_items ADD CONSTRAINT attachment_trash_items_delete_scope_check
  CHECK (delete_scope IS NULL OR delete_scope IN ('single', 'bundle'));
ALTER TABLE attachment_trash_items DROP CONSTRAINT IF EXISTS attachment_trash_items_delete_parent_type_check;
ALTER TABLE attachment_trash_items ADD CONSTRAINT attachment_trash_items_delete_parent_type_check
  CHECK (delete_parent_type IS NULL OR delete_parent_type IN ('none', 'workorder'));

ALTER TABLE memos DROP CONSTRAINT IF EXISTS memos_delete_source_check;
ALTER TABLE memos ADD CONSTRAINT memos_delete_source_check
  CHECK (delete_source IS NULL OR delete_source IN ('manual', 'workorder_bundle', 'system'));
ALTER TABLE memos DROP CONSTRAINT IF EXISTS memos_delete_scope_check;
ALTER TABLE memos ADD CONSTRAINT memos_delete_scope_check
  CHECK (delete_scope IS NULL OR delete_scope IN ('single', 'bundle'));
ALTER TABLE memos DROP CONSTRAINT IF EXISTS memos_delete_parent_type_check;
ALTER TABLE memos ADD CONSTRAINT memos_delete_parent_type_check
  CHECK (delete_parent_type IS NULL OR delete_parent_type IN ('none', 'workorder'));

UPDATE attachment_trash_items
   SET delete_source = COALESCE(delete_source, 'workorder_bundle'),
       delete_scope = COALESCE(delete_scope, 'bundle'),
       delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
       delete_parent_id = COALESCE(delete_parent_id, order_id),
       delete_batch_id = COALESCE(delete_batch_id, order_id)
 WHERE delete_reason = '작업지시서 삭제로 함께 휴지통 이동';

UPDATE attachments
   SET delete_source = COALESCE(delete_source, 'workorder_bundle'),
       delete_scope = COALESCE(delete_scope, 'bundle'),
       delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
       delete_parent_id = COALESCE(delete_parent_id, order_id),
       delete_batch_id = COALESCE(delete_batch_id, order_id)
 WHERE delete_reason = '작업지시서 삭제로 함께 휴지통 이동';

UPDATE spec_sheets
   SET delete_source = COALESCE(delete_source, 'manual'),
       delete_scope = COALESCE(delete_scope, 'bundle'),
       delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
       delete_parent_id = COALESCE(delete_parent_id, id),
       delete_batch_id = COALESCE(delete_batch_id, id)
 WHERE deleted_at IS NOT NULL OR COALESCE(is_active, true) = false;

CREATE INDEX IF NOT EXISTS spec_sheets_delete_metadata_idx
  ON spec_sheets (delete_source, delete_scope, delete_parent_type, delete_parent_id);
CREATE INDEX IF NOT EXISTS attachment_trash_items_delete_metadata_idx
  ON attachment_trash_items (delete_source, delete_scope, delete_parent_type, delete_parent_id);
CREATE INDEX IF NOT EXISTS memos_delete_metadata_idx
  ON memos (delete_source, delete_scope, delete_parent_type, delete_parent_id);
